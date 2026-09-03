import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import { getToolsForRole, type ToolContext } from "./assistant.tools.js";
import { buildSystemPrompt } from "./assistant.prompts.js";

// Groq hosts open-weight models behind an OpenAI-compatible API — the
// official `openai` SDK pointed at Groq's base URL, rather than a
// separate client, per https://console.groq.com/docs/openai. This module
// used to call Anthropic's Claude directly; it was switched to Groq
// (GROQ_API_KEY is already configured for the transcription demo) on
// request, so the model/provider live in exactly the two places below.
const MODEL = "openai/gpt-oss-120b";
const MAX_TOKENS = 2048;
// A hard stop on tool-call rounds — not a real-world limit for the kind of
// one-or-two-lookup question this assistant answers, but it's what keeps a
// confused loop from silently turning into an unbounded API bill.
const MAX_TOOL_ROUNDS = 6;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.GROQ_API_KEY) {
    throw new AppError(500, "MISSING_API_KEY", "GROQ_API_KEY is not configured — set it in Doppler's dev config");
  }
  client ??= new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });
  return client;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type AssistantEvent = { type: "text"; text: string } | { type: "status"; text: string } | { type: "error"; message: string } | { type: "done" };

interface ToolCallAccumulator {
  id: string;
  name: string;
  arguments: string;
}

/**
 * Streams one assistant turn as it's produced, running the tool-use loop
 * itself — Groq's chat-completions streaming doesn't hand back a helper
 * that assembles fragmented tool-call deltas for you the way some SDKs
 * do, so this accumulates them by index (the standard OpenAI-compatible
 * streaming shape) across chunks before executing anything.
 *
 * `ctx` is built by the controller straight from the verified JWT — never
 * from anything in `history` — so every tool call below is scoped to
 * whoever is actually signed in, the same way every other route is.
 */
export async function* streamAssistantReply(history: ChatMessage[], ctx: ToolContext & { firstName: string }): AsyncGenerator<AssistantEvent> {
  const groq = getClient();
  const tools = getToolsForRole(ctx.role);
  const toolMap = new Map(tools.map((t) => [t.name, t]));
  const system = buildSystemPrompt(ctx, new Date().toISOString().slice(0, 10));

  const toolDefs: ChatCompletionTool[] = tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.parameters } }));

  const messages: ChatCompletionMessageParam[] = [{ role: "system", content: system }, ...history.map((m): ChatCompletionMessageParam => ({ role: m.role, content: m.content }))];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const accumulators = new Map<number, ToolCallAccumulator>();
    let finishReason: string | null = null;
    let textContent = "";

    try {
      const stream = await groq.chat.completions.create({
        model: MODEL,
        max_completion_tokens: MAX_TOKENS,
        messages,
        tools: toolDefs.length > 0 ? toolDefs : undefined,
        stream: true,
      });

      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        if (!choice) continue;

        if (choice.delta.content) {
          textContent += choice.delta.content;
          yield { type: "text", text: choice.delta.content };
        }

        for (const tc of choice.delta.tool_calls ?? []) {
          const acc = accumulators.get(tc.index) ?? { id: "", name: "", arguments: "" };
          if (tc.id) acc.id = tc.id;
          if (tc.function?.name) acc.name += tc.function.name;
          if (tc.function?.arguments) acc.arguments += tc.function.arguments;
          accumulators.set(tc.index, acc);
        }

        if (choice.finish_reason) finishReason = choice.finish_reason;
      }
    } catch (err) {
      logger.error({ err }, "assistant: Groq API request failed");
      yield { type: "error", message: describeGroqError(err) };
      return;
    }

    if (finishReason !== "tool_calls" || accumulators.size === 0) {
      yield { type: "done" };
      return;
    }

    const toolCalls = [...accumulators.entries()].sort(([a], [b]) => a - b).map(([, tc]) => tc);

    messages.push({
      role: "assistant",
      content: textContent || null,
      tool_calls: toolCalls.map((tc) => ({ id: tc.id, type: "function", function: { name: tc.name, arguments: tc.arguments } })),
    });

    for (const tc of toolCalls) {
      const found = toolMap.get(tc.name);
      if (!found) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: "This tool isn't available for your role." });
        continue;
      }

      yield { type: "status", text: found.statusLabel };

      let input: Record<string, unknown> = {};
      try {
        input = tc.arguments ? JSON.parse(tc.arguments) : {};
      } catch {
        // Malformed args from the model — most of our tools take none anyway; fall through with an empty object rather than failing the whole turn.
      }

      try {
        const data = await found.handler(input, ctx);
        messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(data) });
      } catch (err) {
        messages.push({ role: "tool", tool_call_id: tc.id, content: toolErrorMessage(err) });
      }
    }
  }

  yield { type: "error", message: "That took more lookups than I'm allowed in one turn — try asking something more specific." };
}

function toolErrorMessage(err: unknown): string {
  if (err instanceof AppError) return err.message;
  logger.error({ err }, "assistant: tool handler threw");
  return "Something went wrong looking that up.";
}

function describeGroqError(err: unknown): string {
  if (err instanceof OpenAI.AuthenticationError) return "The assistant's API key is invalid — check GROQ_API_KEY.";
  if (err instanceof OpenAI.RateLimitError) return "The assistant is getting rate-limited right now — try again in a moment.";
  if (err instanceof OpenAI.APIError) return "The assistant couldn't get a response right now — try again in a moment.";
  return "Something went wrong talking to the assistant.";
}

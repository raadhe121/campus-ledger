import type { Request, Response } from "express";
import { streamAssistantReply, type ChatMessage } from "./assistant.service.js";

/**
 * Not the usual `{ data, meta }` envelope (§08) — this streams newline-
 * delimited JSON events as they're produced, so the widget can render
 * text as it arrives instead of waiting for the whole reply. Bypasses
 * asyncHandler deliberately: every failure path below is caught and
 * written as an `{type:"error"}` event rather than handed to the central
 * error handler, since headers are already sent by the time most errors
 * could happen.
 */
export async function chatHandler(req: Request, res: Response) {
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");

  const ctx = { userId: req.user!.id, role: req.user!.role, schoolId: req.user!.schoolId, firstName: req.user!.firstName };
  const messages = req.body.messages as ChatMessage[];

  try {
    for await (const event of streamAssistantReply(messages, ctx)) {
      res.write(`${JSON.stringify(event)}\n`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong.";
    res.write(`${JSON.stringify({ type: "error", message })}\n`);
  } finally {
    res.end();
  }
}

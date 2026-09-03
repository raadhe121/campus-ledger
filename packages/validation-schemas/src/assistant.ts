import { z } from "zod";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

// The Messages API is stateless (§08) — the client resends the whole
// running conversation every turn, so it's capped here rather than left
// to grow unbounded across a long-lived chat widget session.
export const assistantChatSchema = z
  .object({
    messages: z.array(chatMessageSchema).min(1).max(30),
  })
  .refine((v) => v.messages[v.messages.length - 1]?.role === "user", {
    message: "The last message must be from the user",
    path: ["messages"],
  });
export type AssistantChatInput = z.infer<typeof assistantChatSchema>;

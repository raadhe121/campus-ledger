import { z } from "zod";

// The single source of truth for "what a login request looks like" —
// the API validates incoming requests against this, and the web app's
// login form resolver uses the same schema (architecture §08/§09).
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

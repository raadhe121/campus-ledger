import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Provisioned in docker-compose for local dev; nothing in the app actually
  // reads it yet (no caching/session/queue layer wired up), so it's
  // optional rather than a hard deploy requirement — set it once something
  // does.
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL_DAYS: z.coerce.number().default(30),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),

  // Doppler injects these three automatically into every `doppler run`
  // process — their presence is what lets /health/db tell a Doppler-fed
  // process apart from one reading a plain .env file (README's fallback
  // path, §"Prerequisites").
  DOPPLER_PROJECT: z.string().optional(),
  DOPPLER_CONFIG: z.string().optional(),
  DOPPLER_ENVIRONMENT: z.string().optional(),

  // Only read by prisma/seed.ts, to create the first SUPER_ADMIN — there's
  // no API route for that by design (§06: SUPER_ADMIN is provisioned out
  // of band, never self-registered). Omit the password and the seed
  // script generates and prints one instead of defaulting to something
  // guessable.
  SEED_SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SEED_SUPER_ADMIN_PASSWORD: z.string().min(8).optional(),
  SEED_SUPER_ADMIN_NAME: z.string().optional(),

  // Powers two things against Groq's OpenAI-compatible API: the dummy
  // audio-to-text page (modules/transcription, Whisper) and the AI
  // Assistant (modules/assistant, llama-3.3-70b-versatile) — every role's
  // persistent chat widget. Optional so the rest of the app still boots
  // without it; each route returns a clear error if it's missing when
  // called, rather than failing at startup.
  GROQ_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration — check apps/api/.env against .env.example");
}

export const env = parsed.data;

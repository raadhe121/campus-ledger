import { env } from "../../config/env.js";
import { AppError } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";

const GROQ_TRANSCRIPTION_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

// Fast + cheap Whisper variant on Groq — plenty for a demo page. Swap
// for "whisper-large-v3" if accuracy matters more than latency.
const MODEL = "whisper-large-v3-turbo";
const REQUEST_TIMEOUT_MS = 30_000;

interface GroqTranscriptionResponse {
  text: string;
}

export async function transcribeAudio(file: { buffer: Buffer; originalname: string; mimetype: string }): Promise<string> {
  if (!env.GROQ_API_KEY) {
    throw new AppError(500, "MISSING_API_KEY", "GROQ_API_KEY is not configured — set it in Doppler's dev config");
  }

  logger.info(
    { size: file.buffer.length, mimetype: file.mimetype, originalname: file.originalname },
    "transcription: received file, calling Groq",
  );

  const form = new FormData();
  form.append("model", MODEL);
  form.append("response_format", "json");
  form.append("file", new Blob([file.buffer], { type: file.mimetype || "audio/webm" }), file.originalname || "audio.webm");

  // An unbounded fetch here is exactly how "the API request just hangs
  // forever with no response" happens — a dropped connection to Groq
  // otherwise has nothing to make it fail. AbortController turns that
  // into a clear, bounded error instead.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GROQ_TRANSCRIPTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      logger.error({ timeoutMs: REQUEST_TIMEOUT_MS }, "transcription: Groq request timed out");
      throw new AppError(504, "TRANSCRIPTION_TIMEOUT", `Groq didn't respond within ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    logger.error({ err }, "transcription: network error calling Groq");
    throw new AppError(502, "TRANSCRIPTION_FAILED", "Could not reach Groq's transcription API");
  } finally {
    clearTimeout(timeout);
  }

  logger.info({ status: response.status }, "transcription: Groq responded");

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    logger.error({ status: response.status, detail }, "transcription: Groq rejected the request");
    throw new AppError(502, "TRANSCRIPTION_FAILED", "Groq's transcription API rejected the request", detail.slice(0, 500));
  }

  const result = (await response.json()) as GroqTranscriptionResponse;
  return result.text;
}

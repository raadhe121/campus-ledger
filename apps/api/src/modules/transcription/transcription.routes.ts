import { Router } from "express";
import multer from "multer";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { AppError, ValidationError } from "../../lib/errors.js";
import { transcribeAudio } from "./transcription.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // Groq's own cap on the free tier
});

/**
 * A dummy/demo page's backend, not a real product module — deliberately
 * unauthenticated (no school, no role, nothing to scope) and disabled
 * outside development so it can't become a standing, unmetered proxy to
 * a paid API if this ever got deployed. Delete this whole module, or
 * gate it behind auth + rate limiting, before it's anything but a demo.
 */
export const transcriptionRouter = Router();

transcriptionRouter.post(
  "/transcribe",
  (req, res, next) => {
    if (env.NODE_ENV === "production") return next(new AppError(404, "NOT_FOUND", "Not available"));
    next();
  },
  upload.single("audio"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ValidationError("No audio file received — attach one under the 'audio' field");

    const text = await transcribeAudio(req.file);
    res.json({ data: { text } });
  }),
);

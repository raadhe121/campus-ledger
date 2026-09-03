import { Router } from "express";
import { loginSchema } from "@campus-ledger/validation-schemas";
import { validateBody } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/authenticate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { loginHandler, refreshHandler, logoutHandler, meHandler } from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), asyncHandler(loginHandler));
authRouter.post("/refresh", asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.get("/me", authenticate, meHandler);

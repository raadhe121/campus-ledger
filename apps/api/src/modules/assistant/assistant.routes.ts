import { Router } from "express";
import { assistantChatSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { validateBody } from "../../middleware/validate.js";
import { chatHandler } from "./assistant.controller.js";

// Mounted at /api/v1/assistant. Every role gets this — no route-level
// role gate — so unlike every other module there's no authorize() call
// here; what a caller's assistant can actually see is decided entirely by
// which tools assistant.tools.ts hands their role, not by this route.
export const assistantRouter = Router();

assistantRouter.use(authenticate, tenantContext);

assistantRouter.post("/chat", validateBody(assistantChatSchema), chatHandler);

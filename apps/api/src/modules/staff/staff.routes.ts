import { Router } from "express";
import { createStaffSchema, updateStaffSchema, personStatusSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { createStaffHandler, listStaffHandler, getStaffHandler, updateStaffHandler, setStaffStatusHandler } from "./staff.controller.js";

// Mounted at /api/v1/staff — non-teaching staff (STAFF + ACCOUNTANT).
export const staffRouter = Router();

staffRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

staffRouter.post("/", validateBody(createStaffSchema), asyncHandler(createStaffHandler));
staffRouter.get("/", asyncHandler(listStaffHandler));
staffRouter.get("/:userId", asyncHandler(getStaffHandler));
staffRouter.patch("/:userId", validateBody(updateStaffSchema), asyncHandler(updateStaffHandler));
staffRouter.patch("/:userId/status", validateBody(personStatusSchema), asyncHandler(setStaffStatusHandler));

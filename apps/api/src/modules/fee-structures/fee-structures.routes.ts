import { Router } from "express";
import { createFeeStructureSchema, updateFeeStructureSchema, createFeeItemSchema, updateFeeItemSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createFeeStructureHandler,
  listFeeStructuresHandler,
  getFeeStructureHandler,
  updateFeeStructureHandler,
  deleteFeeStructureHandler,
  createFeeItemHandler,
  updateFeeItemHandler,
  deleteFeeItemHandler,
  generateStudentFeesHandler,
} from "./fee-structures.controller.js";

// Mounted at /api/v1/fee-structures. §07 gives SCHOOL_ADMIN and ACCOUNTANT
// the same "Manage" scope over fees — unlike every earlier Accountant-
// adjacent module, there's no ownership split to enforce between them.
export const feeStructuresRouter = Router();

feeStructuresRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN", "ACCOUNTANT"));

feeStructuresRouter.post("/", validateBody(createFeeStructureSchema), asyncHandler(createFeeStructureHandler));
feeStructuresRouter.get("/", asyncHandler(listFeeStructuresHandler));
feeStructuresRouter.get("/:feeStructureId", asyncHandler(getFeeStructureHandler));
feeStructuresRouter.patch("/:feeStructureId", validateBody(updateFeeStructureSchema), asyncHandler(updateFeeStructureHandler));
feeStructuresRouter.delete("/:feeStructureId", asyncHandler(deleteFeeStructureHandler));

feeStructuresRouter.post("/:feeStructureId/items", validateBody(createFeeItemSchema), asyncHandler(createFeeItemHandler));
feeStructuresRouter.patch("/items/:feeItemId", validateBody(updateFeeItemSchema), asyncHandler(updateFeeItemHandler));
feeStructuresRouter.delete("/items/:feeItemId", asyncHandler(deleteFeeItemHandler));
feeStructuresRouter.post("/items/:feeItemId/generate", asyncHandler(generateStudentFeesHandler));

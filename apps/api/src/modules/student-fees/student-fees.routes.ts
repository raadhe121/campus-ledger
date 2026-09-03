import { Router } from "express";
import { assignStudentFeeSchema, updateStudentFeeSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  assignStudentFeeHandler,
  listStudentFeesHandler,
  getStudentFeeHandler,
  updateStudentFeeHandler,
  deleteStudentFeeHandler,
} from "./student-fees.controller.js";

// Mounted at /api/v1/student-fees — one row per student per FeeItem charge.
// Bulk assignment lives on the FeeItem itself (POST /fee-structures/items/
// :feeItemId/generate); this router is for browsing what that produced and
// for the one-off cases generate doesn't cover (a late enrollment, a
// manual concession). A Student/Parent's own read of these lives entirely
// under /me/fees, never this surface.
export const studentFeesRouter = Router();

studentFeesRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN", "ACCOUNTANT"));

studentFeesRouter.post("/", validateBody(assignStudentFeeSchema), asyncHandler(assignStudentFeeHandler));
studentFeesRouter.get("/", asyncHandler(listStudentFeesHandler));
studentFeesRouter.get("/:studentFeeId", asyncHandler(getStudentFeeHandler));
studentFeesRouter.patch("/:studentFeeId", validateBody(updateStudentFeeSchema), asyncHandler(updateStudentFeeHandler));
studentFeesRouter.delete("/:studentFeeId", asyncHandler(deleteStudentFeeHandler));

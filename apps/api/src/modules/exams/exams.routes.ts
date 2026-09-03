import { Router } from "express";
import { createExamSchema, updateExamSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { createExamHandler, listExamsHandler, getExamHandler, updateExamHandler, deleteExamHandler } from "./exams.controller.js";

// Mounted at /api/v1/exams — School Admin's "Manage" scope (§07). Teacher's
// own slice lives under /exam-subjects (their own subject/section only)
// and /me/results; Student's lives entirely under /me/results.
export const examsRouter = Router();

examsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

examsRouter.post("/", validateBody(createExamSchema), asyncHandler(createExamHandler));
examsRouter.get("/", asyncHandler(listExamsHandler));
examsRouter.get("/:examId", asyncHandler(getExamHandler));
examsRouter.patch("/:examId", validateBody(updateExamSchema), asyncHandler(updateExamHandler));
examsRouter.delete("/:examId", asyncHandler(deleteExamHandler));

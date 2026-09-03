import { Router } from "express";
import { createExamSubjectSchema, updateExamSubjectSchema, enterMarksSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createExamSubjectHandler,
  listExamSubjectsHandler,
  getExamSubjectHandler,
  updateExamSubjectHandler,
  deleteExamSubjectHandler,
  getMarksRosterHandler,
  enterMarksHandler,
} from "./exam-subjects.controller.js";

// Mounted at /api/v1/exam-subjects. Scheduling (create/update/delete, and
// the broad-browse GET /) is School-Admin-only "Manage" (§07), same shape
// as /timetable. Marks entry (roster + enter) also accepts TEACHER — the
// service layer's assertTeacherOwnsSubject is what actually enforces
// "own subject", exactly like attendance's per-section ownership check.
export const examSubjectsRouter = Router();

examSubjectsRouter.use(authenticate, tenantContext);

examSubjectsRouter.post("/", authorize("SCHOOL_ADMIN"), validateBody(createExamSubjectSchema), asyncHandler(createExamSubjectHandler));
examSubjectsRouter.get("/", authorize("SCHOOL_ADMIN"), asyncHandler(listExamSubjectsHandler));
examSubjectsRouter.get("/:examSubjectId", authorize("SCHOOL_ADMIN", "TEACHER"), asyncHandler(getExamSubjectHandler));
examSubjectsRouter.patch("/:examSubjectId", authorize("SCHOOL_ADMIN"), validateBody(updateExamSubjectSchema), asyncHandler(updateExamSubjectHandler));
examSubjectsRouter.delete("/:examSubjectId", authorize("SCHOOL_ADMIN"), asyncHandler(deleteExamSubjectHandler));

examSubjectsRouter.get("/:examSubjectId/roster", authorize("SCHOOL_ADMIN", "TEACHER"), asyncHandler(getMarksRosterHandler));
examSubjectsRouter.post("/:examSubjectId/marks", authorize("SCHOOL_ADMIN", "TEACHER"), validateBody(enterMarksSchema), asyncHandler(enterMarksHandler));

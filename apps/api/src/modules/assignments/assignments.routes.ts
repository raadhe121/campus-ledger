import { Router } from "express";
import { createAssignmentSchema, updateAssignmentSchema, gradeSubmissionSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createAssignmentHandler,
  listAssignmentsHandler,
  getAssignmentHandler,
  updateAssignmentHandler,
  deleteAssignmentHandler,
  listSubmissionsHandler,
  gradeSubmissionHandler,
} from "./assignments.controller.js";

// Mounted at /api/v1/assignments. §07 gives School Admin only "R" here —
// every mutating route below is Teacher-only, and the service layer's
// assertTeacherOwnsSubject/assertOwnAssignment enforce "own", not this
// route layer. Student never reaches this surface at all; their read +
// submit path is entirely under /me/assignments.
export const assignmentsRouter = Router();

assignmentsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN", "TEACHER"));

assignmentsRouter.post("/", authorize("TEACHER"), validateBody(createAssignmentSchema), asyncHandler(createAssignmentHandler));
assignmentsRouter.get("/", asyncHandler(listAssignmentsHandler));
assignmentsRouter.get("/:assignmentId", asyncHandler(getAssignmentHandler));
assignmentsRouter.patch("/:assignmentId", authorize("TEACHER"), validateBody(updateAssignmentSchema), asyncHandler(updateAssignmentHandler));
assignmentsRouter.delete("/:assignmentId", authorize("TEACHER"), asyncHandler(deleteAssignmentHandler));

assignmentsRouter.get("/:assignmentId/submissions", authorize("TEACHER"), asyncHandler(listSubmissionsHandler));
assignmentsRouter.patch("/submissions/:submissionId", authorize("TEACHER"), validateBody(gradeSubmissionSchema), asyncHandler(gradeSubmissionHandler));

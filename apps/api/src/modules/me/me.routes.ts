import { Router } from "express";
import { submitAssignmentSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  getMyStudentDashboardHandler,
  getMyTeacherDashboardHandler,
  getMyAttendanceHandler,
  getMyTimetableHandler,
  getMyResultsHandler,
  getMyExamSubjectsHandler,
  getMyAssignmentsHandler,
  submitMyAssignmentHandler,
  getMyFeesHandler,
  getMyChildrenHandler,
  getChildDashboardHandler,
  getChildAttendanceHandler,
  getChildTimetableHandler,
  getChildResultsHandler,
  getChildAssignmentsHandler,
  getChildFeesHandler,
} from "./me.controller.js";

// Mounted at /api/v1/me — self-service reads (and, for a Student's own
// assignment submission, one write) scoped to the caller's own id (§07:
// every role gets "R (self)"/"R (own)" here, not the Manage scope
// students/*, staff/*, enrollments/*, exams/*, assignments/* require).
// One sub-route per role/module as each gets its own slice; a caller
// never reaches another role's data because there's no id in these URLs
// to substitute — except Parent's /children/:studentId/* routes, where
// the id names *which child*, and the service layer's assertParentOfStudent
// is what actually enforces "R (children)", not this route layer.
export const meRouter = Router();

meRouter.use(authenticate, tenantContext);

meRouter.get("/student", authorize("STUDENT"), asyncHandler(getMyStudentDashboardHandler));
meRouter.get("/teacher", authorize("TEACHER"), asyncHandler(getMyTeacherDashboardHandler));
meRouter.get("/attendance", authorize("STUDENT"), asyncHandler(getMyAttendanceHandler));
meRouter.get("/timetable", authorize("STUDENT", "TEACHER"), asyncHandler(getMyTimetableHandler));
meRouter.get("/results", authorize("STUDENT"), asyncHandler(getMyResultsHandler));
meRouter.get("/exam-subjects", authorize("TEACHER"), asyncHandler(getMyExamSubjectsHandler));
meRouter.get("/assignments", authorize("STUDENT"), asyncHandler(getMyAssignmentsHandler));
meRouter.post("/assignments/:assignmentId/submit", authorize("STUDENT"), validateBody(submitAssignmentSchema), asyncHandler(submitMyAssignmentHandler));
meRouter.get("/fees", authorize("STUDENT"), asyncHandler(getMyFeesHandler));

meRouter.get("/children", authorize("PARENT"), asyncHandler(getMyChildrenHandler));
meRouter.get("/children/:studentId/dashboard", authorize("PARENT"), asyncHandler(getChildDashboardHandler));
meRouter.get("/children/:studentId/attendance", authorize("PARENT"), asyncHandler(getChildAttendanceHandler));
meRouter.get("/children/:studentId/timetable", authorize("PARENT"), asyncHandler(getChildTimetableHandler));
meRouter.get("/children/:studentId/results", authorize("PARENT"), asyncHandler(getChildResultsHandler));
meRouter.get("/children/:studentId/assignments", authorize("PARENT"), asyncHandler(getChildAssignmentsHandler));
meRouter.get("/children/:studentId/fees", authorize("PARENT"), asyncHandler(getChildFeesHandler));

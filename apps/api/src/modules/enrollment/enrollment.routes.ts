import { Router } from "express";
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  transferEnrollmentSchema,
  promoteEnrollmentsSchema,
} from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createEnrollmentHandler,
  listEnrollmentsHandler,
  listCurrentEnrollmentsHandler,
  getEnrollmentHandler,
  getStudentHistoryHandler,
  updateEnrollmentHandler,
  transferEnrollmentHandler,
  promoteEnrollmentsHandler,
} from "./enrollment.controller.js";

// Mounted at /api/v1/enrollments — ?sectionId=/?academicYearId=/?studentId=
// narrow the list (§08). No DELETE: a withdrawal is a status transition
// (PATCH status: WITHDRAWN), not a row removal — see enrollment.service.ts.
export const enrollmentRouter = Router();

enrollmentRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

// Static / batch before :id
enrollmentRouter.get("/current", asyncHandler(listCurrentEnrollmentsHandler));
enrollmentRouter.get("/student/:studentId/history", asyncHandler(getStudentHistoryHandler));
enrollmentRouter.post("/promote", validateBody(promoteEnrollmentsSchema), asyncHandler(promoteEnrollmentsHandler));

enrollmentRouter.post("/", validateBody(createEnrollmentSchema), asyncHandler(createEnrollmentHandler));
enrollmentRouter.get("/", asyncHandler(listEnrollmentsHandler));
enrollmentRouter.get("/:enrollmentId", asyncHandler(getEnrollmentHandler));
enrollmentRouter.patch("/:enrollmentId", validateBody(updateEnrollmentSchema), asyncHandler(updateEnrollmentHandler));
enrollmentRouter.post("/:enrollmentId/transfer", validateBody(transferEnrollmentSchema), asyncHandler(transferEnrollmentHandler));

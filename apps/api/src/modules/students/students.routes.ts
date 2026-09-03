import { Router } from "express";
import {
  createStudentSchema,
  updateStudentSchema,
  personStatusSchema,
  enrollStudentSchema,
  assignClassSchema,
  transferStudentSchema,
} from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createStudentHandler,
  listStudentsHandler,
  listCurrentStudentsHandler,
  getStudentHandler,
  getStudentHistoryHandler,
  updateStudentHandler,
  setStudentStatusHandler,
  enrollStudentHandler,
  assignClassHandler,
  transferStudentHandler,
} from "./students.controller.js";

// Mounted at /api/v1/students.
export const studentsRouter = Router();

studentsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

// Static / more specific first
studentsRouter.get("/current", asyncHandler(listCurrentStudentsHandler));

studentsRouter.post("/", validateBody(createStudentSchema), asyncHandler(createStudentHandler));
studentsRouter.get("/", asyncHandler(listStudentsHandler));

studentsRouter.get("/:userId/history", asyncHandler(getStudentHistoryHandler));
studentsRouter.get("/:userId", asyncHandler(getStudentHandler));
studentsRouter.patch("/:userId", validateBody(updateStudentSchema), asyncHandler(updateStudentHandler));
studentsRouter.patch("/:userId/status", validateBody(personStatusSchema), asyncHandler(setStudentStatusHandler));

// Spec APIs: enroll, assign class, transfer
studentsRouter.post("/:userId/enroll", validateBody(enrollStudentSchema), asyncHandler(enrollStudentHandler));
studentsRouter.post("/:userId/assign-class", validateBody(assignClassSchema), asyncHandler(assignClassHandler));
studentsRouter.post("/:userId/transfer", validateBody(transferStudentSchema), asyncHandler(transferStudentHandler));

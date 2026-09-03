import { Router } from "express";
import { createTeacherSchema, updateTeacherSchema, personStatusSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createTeacherHandler,
  listTeachersHandler,
  getTeacherHandler,
  updateTeacherHandler,
  setTeacherStatusHandler,
} from "./teachers.controller.js";

// Mounted at /api/v1/teachers.
export const teachersRouter = Router();

teachersRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

teachersRouter.post("/", validateBody(createTeacherSchema), asyncHandler(createTeacherHandler));
teachersRouter.get("/", asyncHandler(listTeachersHandler));
teachersRouter.get("/:userId", asyncHandler(getTeacherHandler));
teachersRouter.patch("/:userId", validateBody(updateTeacherSchema), asyncHandler(updateTeacherHandler));
teachersRouter.patch("/:userId/status", validateBody(personStatusSchema), asyncHandler(setTeacherStatusHandler));

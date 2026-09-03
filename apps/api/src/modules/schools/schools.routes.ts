import { Router } from "express";
import { createSchoolSchema, updateSchoolSchema, schoolStatusSchema, createSchoolAdminSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createSchoolHandler,
  listSchoolsHandler,
  getSchoolHandler,
  updateSchoolHandler,
  setSchoolStatusHandler,
  createSchoolAdminHandler,
  listSchoolAdminsHandler,
} from "./schools.controller.js";

// Mounted at /api/v1/super-admin/schools — the explicitly cross-tenant
// namespace described in §06/§08, never the plain /schools path a
// school-scoped role might one day get for its own record.
export const schoolsRouter = Router();

schoolsRouter.use(authenticate, tenantContext, authorize("SUPER_ADMIN"));

schoolsRouter.post("/", validateBody(createSchoolSchema), asyncHandler(createSchoolHandler));
schoolsRouter.get("/", asyncHandler(listSchoolsHandler));
schoolsRouter.get("/:schoolId", asyncHandler(getSchoolHandler));
schoolsRouter.patch("/:schoolId", validateBody(updateSchoolSchema), asyncHandler(updateSchoolHandler));
schoolsRouter.patch("/:schoolId/status", validateBody(schoolStatusSchema), asyncHandler(setSchoolStatusHandler));

schoolsRouter.post("/:schoolId/admins", validateBody(createSchoolAdminSchema), asyncHandler(createSchoolAdminHandler));
schoolsRouter.get("/:schoolId/admins", asyncHandler(listSchoolAdminsHandler));

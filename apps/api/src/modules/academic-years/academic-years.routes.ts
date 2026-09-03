import { Router } from "express";
import { createAcademicYearSchema, updateAcademicYearSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createAcademicYearHandler,
  listAcademicYearsHandler,
  getAcademicYearHandler,
  updateAcademicYearHandler,
  activateAcademicYearHandler,
  deleteAcademicYearHandler,
} from "./academic-years.controller.js";

// Mounted at /api/v1/academic-years — School Admin's own school, scoped by
// their JWT (§08), not an explicit :schoolId path param like Super Admin's
// cross-tenant surface.
export const academicYearsRouter = Router();

academicYearsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

academicYearsRouter.post("/", validateBody(createAcademicYearSchema), asyncHandler(createAcademicYearHandler));
academicYearsRouter.get("/", asyncHandler(listAcademicYearsHandler));
academicYearsRouter.get("/:yearId", asyncHandler(getAcademicYearHandler));
academicYearsRouter.patch("/:yearId", validateBody(updateAcademicYearSchema), asyncHandler(updateAcademicYearHandler));
academicYearsRouter.post("/:yearId/activate", asyncHandler(activateAcademicYearHandler));
academicYearsRouter.delete("/:yearId", asyncHandler(deleteAcademicYearHandler));

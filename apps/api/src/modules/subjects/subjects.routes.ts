import { Router } from "express";
import { createSubjectSchema, updateSubjectSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { createSubjectHandler, listSubjectsHandler, getSubjectHandler, updateSubjectHandler, deleteSubjectHandler } from "./subjects.controller.js";

// Mounted at /api/v1/subjects. Reads are also open to Student/Teacher
// (§07's RBAC matrix: Academic setup is "R" for Student/Teacher/Parent) —
// only the mutating routes stay School-Admin-only ("Manage").
export const subjectsRouter = Router();

subjectsRouter.use(authenticate, tenantContext);

subjectsRouter.post("/", authorize("SCHOOL_ADMIN"), validateBody(createSubjectSchema), asyncHandler(createSubjectHandler));
subjectsRouter.get("/", authorize("SCHOOL_ADMIN", "STUDENT", "TEACHER", "PARENT"), asyncHandler(listSubjectsHandler));
subjectsRouter.get("/:subjectId", authorize("SCHOOL_ADMIN", "STUDENT", "TEACHER", "PARENT"), asyncHandler(getSubjectHandler));
subjectsRouter.patch("/:subjectId", authorize("SCHOOL_ADMIN"), validateBody(updateSubjectSchema), asyncHandler(updateSubjectHandler));
subjectsRouter.delete("/:subjectId", authorize("SCHOOL_ADMIN"), asyncHandler(deleteSubjectHandler));

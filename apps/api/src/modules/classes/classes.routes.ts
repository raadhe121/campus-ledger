import { Router } from "express";
import { createClassSchema, updateClassSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { createClassHandler, listClassesHandler, getClassHandler, updateClassHandler, deleteClassHandler } from "./classes.controller.js";

// Mounted at /api/v1/classes — ?academicYearId= narrows the list (§08's
// fixed-allowlist filtering convention), no separate nested route needed.
export const classesRouter = Router();

classesRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

classesRouter.post("/", validateBody(createClassSchema), asyncHandler(createClassHandler));
classesRouter.get("/", asyncHandler(listClassesHandler));
classesRouter.get("/:classId", asyncHandler(getClassHandler));
classesRouter.patch("/:classId", validateBody(updateClassSchema), asyncHandler(updateClassHandler));
classesRouter.delete("/:classId", asyncHandler(deleteClassHandler));

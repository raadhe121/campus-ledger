import { Router } from "express";
import { createParentSchema, updateParentSchema, personStatusSchema, linkParentStudentSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createParentHandler,
  listParentsHandler,
  getParentHandler,
  updateParentHandler,
  setParentStatusHandler,
  listChildrenHandler,
  linkChildHandler,
  unlinkChildHandler,
} from "./parents.controller.js";

// Mounted at /api/v1/parents.
export const parentsRouter = Router();

parentsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

parentsRouter.post("/", validateBody(createParentSchema), asyncHandler(createParentHandler));
parentsRouter.get("/", asyncHandler(listParentsHandler));
parentsRouter.get("/:userId", asyncHandler(getParentHandler));
parentsRouter.patch("/:userId", validateBody(updateParentSchema), asyncHandler(updateParentHandler));
parentsRouter.patch("/:userId/status", validateBody(personStatusSchema), asyncHandler(setParentStatusHandler));

parentsRouter.get("/:userId/children", asyncHandler(listChildrenHandler));
parentsRouter.post("/:userId/children", validateBody(linkParentStudentSchema), asyncHandler(linkChildHandler));
parentsRouter.delete("/:userId/children/:linkId", asyncHandler(unlinkChildHandler));

import { Router } from "express";
import { createSectionSchema, updateSectionSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { createSectionHandler, listSectionsHandler, getSectionHandler, updateSectionHandler, deleteSectionHandler } from "./sections.controller.js";

// Mounted at /api/v1/sections — ?classId= narrows the list.
export const sectionsRouter = Router();

sectionsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

sectionsRouter.post("/", validateBody(createSectionSchema), asyncHandler(createSectionHandler));
sectionsRouter.get("/", asyncHandler(listSectionsHandler));
sectionsRouter.get("/:sectionId", asyncHandler(getSectionHandler));
sectionsRouter.patch("/:sectionId", validateBody(updateSectionSchema), asyncHandler(updateSectionHandler));
sectionsRouter.delete("/:sectionId", asyncHandler(deleteSectionHandler));

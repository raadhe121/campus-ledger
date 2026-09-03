import { Router } from "express";
import { updateSchoolWebsiteSchema, createAnnouncementSchema, updateAnnouncementSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  getMyWebsiteHandler,
  updateMyWebsiteHandler,
  publishHandler,
  unpublishHandler,
  listMyAnnouncementsHandler,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} from "./school-website.controller.js";

// Mounted at /api/v1/school-website — School Admin's editor for their own
// public site (§UI: "every school has their own website"). SCHOOL_ADMIN-only,
// same as every other School-Admin-owned setup module; the *public* half of
// this feature (what a signed-out visitor sees) is a completely separate,
// unauthenticated route — see public-site.routes.ts — never this one.
export const schoolWebsiteRouter = Router();

schoolWebsiteRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

schoolWebsiteRouter.get("/", asyncHandler(getMyWebsiteHandler));
schoolWebsiteRouter.patch("/", validateBody(updateSchoolWebsiteSchema), asyncHandler(updateMyWebsiteHandler));
schoolWebsiteRouter.post("/publish", asyncHandler(publishHandler));
schoolWebsiteRouter.post("/unpublish", asyncHandler(unpublishHandler));

schoolWebsiteRouter.get("/announcements", asyncHandler(listMyAnnouncementsHandler));
schoolWebsiteRouter.post("/announcements", validateBody(createAnnouncementSchema), asyncHandler(createAnnouncementHandler));
schoolWebsiteRouter.patch("/announcements/:announcementId", validateBody(updateAnnouncementSchema), asyncHandler(updateAnnouncementHandler));
schoolWebsiteRouter.delete("/announcements/:announcementId", asyncHandler(deleteAnnouncementHandler));

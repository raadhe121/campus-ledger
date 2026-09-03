import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { getPublicSiteHandler } from "./public-site.controller.js";

// Mounted at /api/v1/public — the one surface in this whole API a
// signed-out visitor ever reaches. Deliberately outside authenticate/
// tenantContext entirely (there's no caller identity to establish), which
// is exactly why school-website.service.ts's getPublicSite filters by
// school id explicitly rather than leaning on tenant scoping. CORS (wide
// open — any origin, no credentials, since each school's site is an
// independently deployed instance on a host/port never known in advance)
// is handled once, per-path, in app.ts — not here.
export const publicSiteRouter = Router();

publicSiteRouter.get("/schools/:slug", asyncHandler(getPublicSiteHandler));

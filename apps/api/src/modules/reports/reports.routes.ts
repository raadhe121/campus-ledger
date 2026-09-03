import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { getPlatformReportHandler, getSchoolStatsReportHandler, getSchoolReportHandler, getClassReportHandler, getFinancialReportHandler } from "./reports.controller.js";

// Mounted at /api/v1/reports (Phase 08, §11). §07's Reports row: SUPER_ADMIN
// gets "R (all schools)", SCHOOL_ADMIN "R (own school)", TEACHER "R (own
// class)", ACCOUNTANT "R (financial)" — SCHOOL_ADMIN also gets financial,
// the same shared scope Phase 06 already gave them over fees/payments.
// STUDENT/PARENT/STAFF get no Reports scope — their own /me/* reads already
// answer "how am I doing", so there's nothing here for them to reach.
export const reportsRouter = Router();

reportsRouter.use(authenticate, tenantContext);

reportsRouter.get("/platform", authorize("SUPER_ADMIN"), asyncHandler(getPlatformReportHandler));
reportsRouter.get("/schools/:schoolId", authorize("SUPER_ADMIN"), asyncHandler(getSchoolStatsReportHandler));
reportsRouter.get("/school", authorize("SCHOOL_ADMIN"), asyncHandler(getSchoolReportHandler));
reportsRouter.get("/class", authorize("TEACHER"), asyncHandler(getClassReportHandler));
reportsRouter.get("/financial", authorize("SCHOOL_ADMIN", "ACCOUNTANT"), asyncHandler(getFinancialReportHandler));

import { Router } from "express";
import { markAttendanceSchema, updateAttendanceRecordSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { getRosterHandler, markAttendanceHandler, updateAttendanceRecordHandler } from "./attendance.controller.js";

// Mounted at /api/v1/attendance. School Admin has "Manage" across every
// section; Teacher has "CRU (own class)" — the service layer's
// assertSectionAccess is what actually enforces "own", not this route
// layer, since a Teacher does need to reach this surface at all (§07).
export const attendanceRouter = Router();

attendanceRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN", "TEACHER"));

attendanceRouter.get("/roster", asyncHandler(getRosterHandler));
attendanceRouter.post("/", validateBody(markAttendanceSchema), asyncHandler(markAttendanceHandler));
attendanceRouter.patch("/:recordId", validateBody(updateAttendanceRecordSchema), asyncHandler(updateAttendanceRecordHandler));

import { Router } from "express";
import { createTimetableSlotSchema, updateTimetableSlotSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import {
  createTimetableSlotHandler,
  listTimetableSlotsHandler,
  getTimetableSlotHandler,
  updateTimetableSlotHandler,
  deleteTimetableSlotHandler,
} from "./timetable.controller.js";

// Mounted at /api/v1/timetable — School Admin's full "Manage" scope on the
// whole school's schedule (§07). Teacher/Student only get their own slice
// via /me/timetable, never this broad-browse surface.
export const timetableRouter = Router();

timetableRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN"));

timetableRouter.post("/", validateBody(createTimetableSlotSchema), asyncHandler(createTimetableSlotHandler));
timetableRouter.get("/", asyncHandler(listTimetableSlotsHandler));
timetableRouter.get("/:slotId", asyncHandler(getTimetableSlotHandler));
timetableRouter.patch("/:slotId", validateBody(updateTimetableSlotSchema), asyncHandler(updateTimetableSlotHandler));
timetableRouter.delete("/:slotId", asyncHandler(deleteTimetableSlotHandler));

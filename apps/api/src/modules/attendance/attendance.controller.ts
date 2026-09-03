import type { Request, Response } from "express";
import { ValidationError } from "../../lib/errors.js";
import * as attendanceService from "./attendance.service.js";

export async function getRosterHandler(req: Request, res: Response) {
  const sectionId = typeof req.query.sectionId === "string" ? req.query.sectionId : undefined;
  const dateParam = typeof req.query.date === "string" ? req.query.date : undefined;
  const date = dateParam ? new Date(dateParam) : undefined;

  if (!sectionId || !date || Number.isNaN(date.getTime())) throw new ValidationError("sectionId and a valid date (YYYY-MM-DD) are required");

  const roster = await attendanceService.getRoster(sectionId, date, req.user!.role, req.user!.id);
  res.json({ data: roster });
}

export async function markAttendanceHandler(req: Request, res: Response) {
  const records = await attendanceService.markAttendance(req.body, req.user!.id, req.user!.role, req.user!.schoolId!);
  res.status(200).json({ data: records });
}

export async function updateAttendanceRecordHandler(req: Request, res: Response) {
  const record = await attendanceService.updateAttendanceRecord(req.params.recordId!, req.body, req.user!.id, req.user!.role, req.user!.schoolId!);
  res.json({ data: record });
}

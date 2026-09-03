import type { Request, Response } from "express";
import * as timetableService from "./timetable.service.js";

export async function createTimetableSlotHandler(req: Request, res: Response) {
  const slot = await timetableService.createTimetableSlot(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: slot });
}

export async function listTimetableSlotsHandler(req: Request, res: Response) {
  const { slots, meta } = await timetableService.listTimetableSlots(req.query);
  res.json({ data: slots, meta });
}

export async function getTimetableSlotHandler(req: Request, res: Response) {
  const slot = await timetableService.getTimetableSlot(req.params.slotId!);
  res.json({ data: slot });
}

export async function updateTimetableSlotHandler(req: Request, res: Response) {
  const slot = await timetableService.updateTimetableSlot(req.params.slotId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: slot });
}

export async function deleteTimetableSlotHandler(req: Request, res: Response) {
  await timetableService.deleteTimetableSlot(req.params.slotId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

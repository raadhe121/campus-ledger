import type { Request, Response } from "express";
import * as staffService from "./staff.service.js";

export async function createStaffHandler(req: Request, res: Response) {
  const { result, tempPassword } = await staffService.createStaffMember(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: { ...result, tempPassword } });
}

export async function listStaffHandler(req: Request, res: Response) {
  const { people, meta } = await staffService.listStaff(req.query);
  res.json({ data: people, meta });
}

export async function getStaffHandler(req: Request, res: Response) {
  const member = await staffService.getStaffMember(req.params.userId!);
  res.json({ data: member });
}

export async function updateStaffHandler(req: Request, res: Response) {
  const member = await staffService.updateStaffMember(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: member });
}

export async function setStaffStatusHandler(req: Request, res: Response) {
  const member = await staffService.setStaffMemberStatus(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: member });
}

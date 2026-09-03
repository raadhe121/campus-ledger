import type { Request, Response } from "express";
import * as teachersService from "./teachers.service.js";

export async function createTeacherHandler(req: Request, res: Response) {
  const { result, tempPassword } = await teachersService.createTeacher(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: { ...result, tempPassword } });
}

export async function listTeachersHandler(req: Request, res: Response) {
  const { people, meta } = await teachersService.listTeachers(req.query);
  res.json({ data: people, meta });
}

export async function getTeacherHandler(req: Request, res: Response) {
  const teacher = await teachersService.getTeacher(req.params.userId!);
  res.json({ data: teacher });
}

export async function updateTeacherHandler(req: Request, res: Response) {
  const teacher = await teachersService.updateTeacher(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: teacher });
}

export async function setTeacherStatusHandler(req: Request, res: Response) {
  const teacher = await teachersService.setTeacherStatus(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: teacher });
}

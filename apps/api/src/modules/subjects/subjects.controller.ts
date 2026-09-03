import type { Request, Response } from "express";
import * as subjectsService from "./subjects.service.js";

export async function createSubjectHandler(req: Request, res: Response) {
  const subject = await subjectsService.createSubject(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: subject });
}

export async function listSubjectsHandler(req: Request, res: Response) {
  const { subjects, meta } = await subjectsService.listSubjects(req.query);
  res.json({ data: subjects, meta });
}

export async function getSubjectHandler(req: Request, res: Response) {
  const subject = await subjectsService.getSubject(req.params.subjectId!);
  res.json({ data: subject });
}

export async function updateSubjectHandler(req: Request, res: Response) {
  const subject = await subjectsService.updateSubject(req.params.subjectId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: subject });
}

export async function deleteSubjectHandler(req: Request, res: Response) {
  await subjectsService.deleteSubject(req.params.subjectId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

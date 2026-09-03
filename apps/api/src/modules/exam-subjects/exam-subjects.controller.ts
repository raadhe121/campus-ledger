import type { Request, Response } from "express";
import * as examSubjectsService from "./exam-subjects.service.js";

export async function createExamSubjectHandler(req: Request, res: Response) {
  const examSubject = await examSubjectsService.createExamSubject(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: examSubject });
}

export async function listExamSubjectsHandler(req: Request, res: Response) {
  const { examSubjects, meta } = await examSubjectsService.listExamSubjects(req.query);
  res.json({ data: examSubjects, meta });
}

export async function getExamSubjectHandler(req: Request, res: Response) {
  const examSubject = await examSubjectsService.getExamSubject(req.params.examSubjectId!);
  res.json({ data: examSubject });
}

export async function updateExamSubjectHandler(req: Request, res: Response) {
  const examSubject = await examSubjectsService.updateExamSubject(req.params.examSubjectId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: examSubject });
}

export async function deleteExamSubjectHandler(req: Request, res: Response) {
  await examSubjectsService.deleteExamSubject(req.params.examSubjectId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

export async function getMarksRosterHandler(req: Request, res: Response) {
  const roster = await examSubjectsService.getMarksRoster(req.params.examSubjectId!, req.user!.role, req.user!.id);
  res.json({ data: roster });
}

export async function enterMarksHandler(req: Request, res: Response) {
  const results = await examSubjectsService.enterMarks(req.params.examSubjectId!, req.body, req.user!.id, req.user!.role, req.user!.schoolId!);
  res.status(200).json({ data: results });
}

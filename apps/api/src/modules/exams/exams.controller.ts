import type { Request, Response } from "express";
import * as examsService from "./exams.service.js";

export async function createExamHandler(req: Request, res: Response) {
  const exam = await examsService.createExam(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: exam });
}

export async function listExamsHandler(req: Request, res: Response) {
  const { exams, meta } = await examsService.listExams(req.query);
  res.json({ data: exams, meta });
}

export async function getExamHandler(req: Request, res: Response) {
  const exam = await examsService.getExam(req.params.examId!);
  res.json({ data: exam });
}

export async function updateExamHandler(req: Request, res: Response) {
  const exam = await examsService.updateExam(req.params.examId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: exam });
}

export async function deleteExamHandler(req: Request, res: Response) {
  await examsService.deleteExam(req.params.examId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

import type { Request, Response } from "express";
import * as studentsService from "./students.service.js";

export async function createStudentHandler(req: Request, res: Response) {
  const { result, tempPassword } = await studentsService.createStudent(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: { ...result, tempPassword } });
}

export async function listStudentsHandler(req: Request, res: Response) {
  const { students, meta } = await studentsService.listStudents(req.query as Record<string, unknown>);
  res.json({ data: students, meta });
}

export async function listCurrentStudentsHandler(req: Request, res: Response) {
  const { students, enrollments, meta } = await studentsService.listCurrentStudents(req.query as Record<string, unknown>, req.user!.schoolId!);
  res.json({ data: students, enrollments, meta });
}

export async function getStudentHandler(req: Request, res: Response) {
  const student = await studentsService.getStudent(req.params.userId!);
  res.json({ data: student });
}

export async function getStudentHistoryHandler(req: Request, res: Response) {
  const { student, history, currentEnrollment } = await studentsService.getStudentHistory(req.params.userId!);
  res.json({ data: { student, history, currentEnrollment } });
}

export async function updateStudentHandler(req: Request, res: Response) {
  const student = await studentsService.updateStudent(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: student });
}

export async function setStudentStatusHandler(req: Request, res: Response) {
  const student = await studentsService.setStudentStatus(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: student });
}

export async function enrollStudentHandler(req: Request, res: Response) {
  const enrollment = await studentsService.enrollStudent(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: enrollment });
}

export async function assignClassHandler(req: Request, res: Response) {
  const enrollment = await studentsService.assignClass(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: enrollment });
}

export async function transferStudentHandler(req: Request, res: Response) {
  const enrollment = await studentsService.transferStudent(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: enrollment });
}

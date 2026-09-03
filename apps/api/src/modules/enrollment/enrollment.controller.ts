import type { Request, Response } from "express";
import * as enrollmentService from "./enrollment.service.js";

export async function createEnrollmentHandler(req: Request, res: Response) {
  const enrollment = await enrollmentService.createEnrollment(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: enrollment });
}

export async function listEnrollmentsHandler(req: Request, res: Response) {
  const { enrollments, meta } = await enrollmentService.listEnrollments(req.query as Record<string, unknown>);
  res.json({ data: enrollments, meta });
}

export async function listCurrentEnrollmentsHandler(req: Request, res: Response) {
  const { enrollments, meta } = await enrollmentService.listCurrentEnrollments(req.query as Record<string, unknown>, req.user!.schoolId!);
  res.json({ data: enrollments, meta });
}

export async function getEnrollmentHandler(req: Request, res: Response) {
  const enrollment = await enrollmentService.getEnrollment(req.params.enrollmentId!);
  res.json({ data: enrollment });
}

export async function getStudentHistoryHandler(req: Request, res: Response) {
  const history = await enrollmentService.getStudentHistory(req.params.studentId!);
  res.json({ data: history });
}

export async function updateEnrollmentHandler(req: Request, res: Response) {
  const enrollment = await enrollmentService.updateEnrollment(req.params.enrollmentId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: enrollment });
}

export async function transferEnrollmentHandler(req: Request, res: Response) {
  const enrollment = await enrollmentService.transferEnrollment(req.params.enrollmentId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: enrollment });
}

export async function promoteEnrollmentsHandler(req: Request, res: Response) {
  const enrollments = await enrollmentService.promoteEnrollments(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: enrollments });
}

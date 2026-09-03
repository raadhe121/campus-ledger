import type { Request, Response } from "express";
import * as studentFeesService from "./student-fees.service.js";

export async function assignStudentFeeHandler(req: Request, res: Response) {
  const studentFee = await studentFeesService.assignStudentFee(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: studentFee });
}

export async function listStudentFeesHandler(req: Request, res: Response) {
  const { studentFees, meta } = await studentFeesService.listStudentFees(req.query);
  res.json({ data: studentFees, meta });
}

export async function getStudentFeeHandler(req: Request, res: Response) {
  const studentFee = await studentFeesService.getStudentFee(req.params.studentFeeId!);
  res.json({ data: studentFee });
}

export async function updateStudentFeeHandler(req: Request, res: Response) {
  const studentFee = await studentFeesService.updateStudentFee(req.params.studentFeeId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: studentFee });
}

export async function deleteStudentFeeHandler(req: Request, res: Response) {
  await studentFeesService.deleteStudentFee(req.params.studentFeeId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

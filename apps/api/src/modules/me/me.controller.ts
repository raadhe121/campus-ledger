import type { Request, Response } from "express";
import * as meService from "./me.service.js";

export async function getMyStudentDashboardHandler(req: Request, res: Response) {
  const data = await meService.getMyStudentDashboard(req.user!.id);
  res.json({ data });
}

export async function getMyTeacherDashboardHandler(req: Request, res: Response) {
  const data = await meService.getMyTeacherDashboard(req.user!.id);
  res.json({ data });
}

export async function getMyAttendanceHandler(req: Request, res: Response) {
  const data = await meService.getMyAttendance(req.user!.id);
  res.json({ data });
}

export async function getMyTimetableHandler(req: Request, res: Response) {
  const data = await meService.getMyTimetable(req.user!.id, req.user!.role);
  res.json({ data });
}

export async function getMyResultsHandler(req: Request, res: Response) {
  const data = await meService.getMyResults(req.user!.id);
  res.json({ data });
}

export async function getMyExamSubjectsHandler(req: Request, res: Response) {
  const data = await meService.getMyExamSubjects(req.user!.id);
  res.json({ data });
}

export async function getMyAssignmentsHandler(req: Request, res: Response) {
  const data = await meService.getMyAssignments(req.user!.id);
  res.json({ data });
}

export async function submitMyAssignmentHandler(req: Request, res: Response) {
  const data = await meService.submitMyAssignment(req.params.assignmentId!, req.body, req.user!.id, req.user!.schoolId!);
  res.status(200).json({ data });
}

export async function getMyFeesHandler(req: Request, res: Response) {
  const data = await meService.getMyFees(req.user!.id);
  res.json({ data });
}

export async function getMyChildrenHandler(req: Request, res: Response) {
  const data = await meService.getMyChildren(req.user!.id);
  res.json({ data });
}

export async function getChildDashboardHandler(req: Request, res: Response) {
  const data = await meService.getChildDashboard(req.user!.id, req.params.studentId!);
  res.json({ data });
}

export async function getChildAttendanceHandler(req: Request, res: Response) {
  const data = await meService.getChildAttendance(req.user!.id, req.params.studentId!);
  res.json({ data });
}

export async function getChildTimetableHandler(req: Request, res: Response) {
  const data = await meService.getChildTimetable(req.user!.id, req.params.studentId!);
  res.json({ data });
}

export async function getChildResultsHandler(req: Request, res: Response) {
  const data = await meService.getChildResults(req.user!.id, req.params.studentId!);
  res.json({ data });
}

export async function getChildAssignmentsHandler(req: Request, res: Response) {
  const data = await meService.getChildAssignments(req.user!.id, req.params.studentId!);
  res.json({ data });
}

export async function getChildFeesHandler(req: Request, res: Response) {
  const data = await meService.getChildFees(req.user!.id, req.params.studentId!);
  res.json({ data });
}

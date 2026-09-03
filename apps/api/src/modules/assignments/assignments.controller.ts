import type { Request, Response } from "express";
import * as assignmentsService from "./assignments.service.js";

export async function createAssignmentHandler(req: Request, res: Response) {
  const assignment = await assignmentsService.createAssignment(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: assignment });
}

export async function listAssignmentsHandler(req: Request, res: Response) {
  const { assignments, meta } = await assignmentsService.listAssignments(req.query, req.user!.role, req.user!.id);
  res.json({ data: assignments, meta });
}

export async function getAssignmentHandler(req: Request, res: Response) {
  const assignment = await assignmentsService.getAssignment(req.params.assignmentId!, req.user!.role, req.user!.id);
  res.json({ data: assignment });
}

export async function updateAssignmentHandler(req: Request, res: Response) {
  const assignment = await assignmentsService.updateAssignment(req.params.assignmentId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: assignment });
}

export async function deleteAssignmentHandler(req: Request, res: Response) {
  await assignmentsService.deleteAssignment(req.params.assignmentId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

export async function listSubmissionsHandler(req: Request, res: Response) {
  const submissions = await assignmentsService.listSubmissions(req.params.assignmentId!, req.user!.id);
  res.json({ data: submissions });
}

export async function gradeSubmissionHandler(req: Request, res: Response) {
  const submission = await assignmentsService.gradeSubmission(req.params.submissionId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: submission });
}

import type { Request, Response } from "express";
import * as classesService from "./classes.service.js";

export async function createClassHandler(req: Request, res: Response) {
  const cls = await classesService.createClass(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: cls });
}

export async function listClassesHandler(req: Request, res: Response) {
  const { classes, meta } = await classesService.listClasses(req.query);
  res.json({ data: classes, meta });
}

export async function getClassHandler(req: Request, res: Response) {
  const cls = await classesService.getClass(req.params.classId!);
  res.json({ data: cls });
}

export async function updateClassHandler(req: Request, res: Response) {
  const cls = await classesService.updateClass(req.params.classId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: cls });
}

export async function deleteClassHandler(req: Request, res: Response) {
  await classesService.deleteClass(req.params.classId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

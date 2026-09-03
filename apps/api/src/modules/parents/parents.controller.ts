import type { Request, Response } from "express";
import * as parentsService from "./parents.service.js";

export async function createParentHandler(req: Request, res: Response) {
  const result = await parentsService.createParent(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: result });
}

export async function listParentsHandler(req: Request, res: Response) {
  const { parents, meta } = await parentsService.listParents(req.query);
  res.json({ data: parents, meta });
}

export async function getParentHandler(req: Request, res: Response) {
  const parent = await parentsService.getParent(req.params.userId!);
  res.json({ data: parent });
}

export async function updateParentHandler(req: Request, res: Response) {
  const parent = await parentsService.updateParent(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: parent });
}

export async function setParentStatusHandler(req: Request, res: Response) {
  const parent = await parentsService.setParentStatus(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: parent });
}

export async function listChildrenHandler(req: Request, res: Response) {
  const children = await parentsService.listChildren(req.params.userId!);
  res.json({ data: children });
}

export async function linkChildHandler(req: Request, res: Response) {
  const link = await parentsService.linkChild(req.params.userId!, req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: link });
}

export async function unlinkChildHandler(req: Request, res: Response) {
  await parentsService.unlinkChild(req.params.userId!, req.params.linkId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

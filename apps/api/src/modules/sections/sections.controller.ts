import type { Request, Response } from "express";
import * as sectionsService from "./sections.service.js";

export async function createSectionHandler(req: Request, res: Response) {
  const section = await sectionsService.createSection(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: section });
}

export async function listSectionsHandler(req: Request, res: Response) {
  const { sections, meta } = await sectionsService.listSections(req.query);
  res.json({ data: sections, meta });
}

export async function getSectionHandler(req: Request, res: Response) {
  const section = await sectionsService.getSection(req.params.sectionId!);
  res.json({ data: section });
}

export async function updateSectionHandler(req: Request, res: Response) {
  const section = await sectionsService.updateSection(req.params.sectionId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: section });
}

export async function deleteSectionHandler(req: Request, res: Response) {
  await sectionsService.deleteSection(req.params.sectionId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

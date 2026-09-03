import type { Request, Response } from "express";
import * as websiteService from "./school-website.service.js";

export async function getMyWebsiteHandler(req: Request, res: Response) {
  res.json({ data: await websiteService.getMyWebsite(req.user!.schoolId!) });
}

export async function updateMyWebsiteHandler(req: Request, res: Response) {
  res.json({ data: await websiteService.updateMyWebsite(req.body, req.user!.id, req.user!.schoolId!) });
}

export async function publishHandler(req: Request, res: Response) {
  res.json({ data: await websiteService.setPublished(true, req.user!.id, req.user!.schoolId!) });
}

export async function unpublishHandler(req: Request, res: Response) {
  res.json({ data: await websiteService.setPublished(false, req.user!.id, req.user!.schoolId!) });
}

export async function listMyAnnouncementsHandler(_req: Request, res: Response) {
  res.json({ data: await websiteService.listMyAnnouncements() });
}

export async function createAnnouncementHandler(req: Request, res: Response) {
  const announcement = await websiteService.createAnnouncement(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: announcement });
}

export async function updateAnnouncementHandler(req: Request, res: Response) {
  const announcement = await websiteService.updateAnnouncement(req.params.announcementId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: announcement });
}

export async function deleteAnnouncementHandler(req: Request, res: Response) {
  await websiteService.deleteAnnouncement(req.params.announcementId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

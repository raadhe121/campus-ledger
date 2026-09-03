import type { Request, Response } from "express";
import * as websiteService from "./school-website.service.js";

export async function getPublicSiteHandler(req: Request, res: Response) {
  res.json({ data: await websiteService.getPublicSite(req.params.slug!) });
}

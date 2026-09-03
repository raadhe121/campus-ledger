import type { Request, Response } from "express";
import * as reportsService from "./reports.service.js";

export async function getPlatformReportHandler(_req: Request, res: Response) {
  res.json({ data: await reportsService.getPlatformReport() });
}

export async function getSchoolStatsReportHandler(req: Request, res: Response) {
  res.json({ data: await reportsService.getSchoolStatsReport(req.params.schoolId!) });
}

export async function getSchoolReportHandler(_req: Request, res: Response) {
  res.json({ data: await reportsService.getSchoolReport() });
}

export async function getClassReportHandler(req: Request, res: Response) {
  res.json({ data: await reportsService.getClassReport(req.user!.id) });
}

export async function getFinancialReportHandler(_req: Request, res: Response) {
  res.json({ data: await reportsService.getFinancialReport() });
}

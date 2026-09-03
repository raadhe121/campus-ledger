import type { Request, Response } from "express";
import * as schoolsService from "./schools.service.js";

export async function createSchoolHandler(req: Request, res: Response) {
  const school = await schoolsService.createSchool(req.body, req.user!.id);
  res.status(201).json({ data: school });
}

export async function listSchoolsHandler(req: Request, res: Response) {
  const { schools, meta } = await schoolsService.listSchools(req.query);
  res.json({ data: schools, meta });
}

export async function getSchoolHandler(req: Request, res: Response) {
  const school = await schoolsService.getSchool(req.params.schoolId!);
  res.json({ data: school });
}

export async function updateSchoolHandler(req: Request, res: Response) {
  const school = await schoolsService.updateSchool(req.params.schoolId!, req.body, req.user!.id);
  res.json({ data: school });
}

export async function setSchoolStatusHandler(req: Request, res: Response) {
  const school = await schoolsService.setSchoolStatus(req.params.schoolId!, req.body, req.user!.id);
  res.json({ data: school });
}

export async function createSchoolAdminHandler(req: Request, res: Response) {
  const result = await schoolsService.createSchoolAdmin(req.params.schoolId!, req.body, req.user!.id);
  res.status(201).json({ data: result });
}

export async function listSchoolAdminsHandler(req: Request, res: Response) {
  const { admins, meta } = await schoolsService.listSchoolAdmins(req.params.schoolId!, req.query);
  res.json({ data: admins, meta });
}

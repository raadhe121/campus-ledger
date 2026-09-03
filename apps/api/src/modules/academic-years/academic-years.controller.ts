import type { Request, Response } from "express";
import * as academicYearsService from "./academic-years.service.js";

export async function createAcademicYearHandler(req: Request, res: Response) {
  const year = await academicYearsService.createAcademicYear(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: year });
}

export async function listAcademicYearsHandler(req: Request, res: Response) {
  const { years, meta } = await academicYearsService.listAcademicYears(req.query);
  res.json({ data: years, meta });
}

export async function getAcademicYearHandler(req: Request, res: Response) {
  const year = await academicYearsService.getAcademicYear(req.params.yearId!);
  res.json({ data: year });
}

export async function updateAcademicYearHandler(req: Request, res: Response) {
  const year = await academicYearsService.updateAcademicYear(req.params.yearId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: year });
}

export async function activateAcademicYearHandler(req: Request, res: Response) {
  const year = await academicYearsService.activateAcademicYear(req.params.yearId!, req.user!.id, req.user!.schoolId!);
  res.json({ data: year });
}

export async function deleteAcademicYearHandler(req: Request, res: Response) {
  await academicYearsService.deleteAcademicYear(req.params.yearId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

import type { Request, Response } from "express";
import * as feeStructuresService from "./fee-structures.service.js";

export async function createFeeStructureHandler(req: Request, res: Response) {
  const feeStructure = await feeStructuresService.createFeeStructure(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: feeStructure });
}

export async function listFeeStructuresHandler(req: Request, res: Response) {
  const { feeStructures, meta } = await feeStructuresService.listFeeStructures(req.query);
  res.json({ data: feeStructures, meta });
}

export async function getFeeStructureHandler(req: Request, res: Response) {
  const feeStructure = await feeStructuresService.getFeeStructure(req.params.feeStructureId!);
  res.json({ data: feeStructure });
}

export async function updateFeeStructureHandler(req: Request, res: Response) {
  const feeStructure = await feeStructuresService.updateFeeStructure(req.params.feeStructureId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: feeStructure });
}

export async function deleteFeeStructureHandler(req: Request, res: Response) {
  await feeStructuresService.deleteFeeStructure(req.params.feeStructureId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

export async function createFeeItemHandler(req: Request, res: Response) {
  const item = await feeStructuresService.createFeeItem(req.params.feeStructureId!, req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: item });
}

export async function updateFeeItemHandler(req: Request, res: Response) {
  const item = await feeStructuresService.updateFeeItem(req.params.feeItemId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: item });
}

export async function deleteFeeItemHandler(req: Request, res: Response) {
  await feeStructuresService.deleteFeeItem(req.params.feeItemId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

export async function generateStudentFeesHandler(req: Request, res: Response) {
  const result = await feeStructuresService.generateStudentFees(req.params.feeItemId!, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: result });
}

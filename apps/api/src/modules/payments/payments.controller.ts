import type { Request, Response } from "express";
import * as paymentsService from "./payments.service.js";

export async function recordPaymentHandler(req: Request, res: Response) {
  const payment = await paymentsService.recordPayment(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: payment });
}

export async function listPaymentsHandler(req: Request, res: Response) {
  const { payments, meta } = await paymentsService.listPayments(req.query);
  res.json({ data: payments, meta });
}

export async function getPaymentHandler(req: Request, res: Response) {
  const payment = await paymentsService.getPayment(req.params.paymentId!);
  res.json({ data: payment });
}

import type { Request, Response } from "express";
import * as expensesService from "./expenses.service.js";

export async function createExpenseHandler(req: Request, res: Response) {
  const expense = await expensesService.createExpense(req.body, req.user!.id, req.user!.schoolId!);
  res.status(201).json({ data: expense });
}

export async function listExpensesHandler(req: Request, res: Response) {
  const { expenses, meta } = await expensesService.listExpenses(req.query);
  res.json({ data: expenses, meta });
}

export async function getExpenseHandler(req: Request, res: Response) {
  const expense = await expensesService.getExpense(req.params.expenseId!);
  res.json({ data: expense });
}

export async function updateExpenseHandler(req: Request, res: Response) {
  const expense = await expensesService.updateExpense(req.params.expenseId!, req.body, req.user!.id, req.user!.schoolId!);
  res.json({ data: expense });
}

export async function deleteExpenseHandler(req: Request, res: Response) {
  await expensesService.deleteExpense(req.params.expenseId!, req.user!.id, req.user!.schoolId!);
  res.status(204).send();
}

import { Router } from "express";
import { createExpenseSchema, updateExpenseSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { createExpenseHandler, listExpensesHandler, getExpenseHandler, updateExpenseHandler, deleteExpenseHandler } from "./expenses.controller.js";

// Mounted at /api/v1/expenses. §07 narrows here: ACCOUNTANT keeps "Manage",
// but SCHOOL_ADMIN drops to "R" — the one module in this phase where their
// scope doesn't match fees/payments' shared Manage.
export const expensesRouter = Router();

expensesRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN", "ACCOUNTANT"));

expensesRouter.post("/", authorize("ACCOUNTANT"), validateBody(createExpenseSchema), asyncHandler(createExpenseHandler));
expensesRouter.get("/", asyncHandler(listExpensesHandler));
expensesRouter.get("/:expenseId", asyncHandler(getExpenseHandler));
expensesRouter.patch("/:expenseId", authorize("ACCOUNTANT"), validateBody(updateExpenseSchema), asyncHandler(updateExpenseHandler));
expensesRouter.delete("/:expenseId", authorize("ACCOUNTANT"), asyncHandler(deleteExpenseHandler));

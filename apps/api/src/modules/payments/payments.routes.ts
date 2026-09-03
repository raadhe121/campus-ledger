import { Router } from "express";
import { recordPaymentSchema } from "@campus-ledger/validation-schemas";
import { authenticate } from "../../middleware/authenticate.js";
import { tenantContext } from "../../middleware/tenantContext.js";
import { authorize } from "../../middleware/authorize.js";
import { validateBody } from "../../middleware/validate.js";
import { idempotent } from "../../middleware/idempotency.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { recordPaymentHandler, listPaymentsHandler, getPaymentHandler } from "./payments.controller.js";

// Mounted at /api/v1/payments. §07: same SCHOOL_ADMIN/ACCOUNTANT "Manage"
// scope as fee-structures/student-fees. GET :paymentId doubles as the
// receipt view — every Payment carries exactly one Receipt (issued in the
// same transaction that records it), so there's no separate lookup.
export const paymentsRouter = Router();

paymentsRouter.use(authenticate, tenantContext, authorize("SCHOOL_ADMIN", "ACCOUNTANT"));

// §08: payment-recording endpoints require an Idempotency-Key header so a
// retried request never double-charges a fee.
paymentsRouter.post("/", idempotent("payment.create"), validateBody(recordPaymentSchema), asyncHandler(recordPaymentHandler));
paymentsRouter.get("/", asyncHandler(listPaymentsHandler));
paymentsRouter.get("/:paymentId", asyncHandler(getPaymentHandler));

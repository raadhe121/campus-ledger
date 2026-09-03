import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordPaymentSchema, type RecordPaymentInput } from "@campus-ledger/validation-schemas";
import type { StudentFeeWithDetails, PaymentWithDetails } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useListStudentFeesQuery, useRecordPaymentMutation } from "./feesApi";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-surface-2 text-muted",
  PARTIAL: "bg-amber-50 text-amber-700",
  PAID: "bg-emerald-50 text-emerald-700",
};

const METHOD_LABEL: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  BANK_TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
  ONLINE: "Online",
  OTHER: "Other",
};

export function StudentFeesPage() {
  const [status, setStatus] = useState<string>("");
  const { data, isLoading, error } = useListStudentFeesQuery({ limit: 100, status: status || undefined });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Fees</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Student fees</h1>
          <p className="text-sm text-muted mt-1">Every charge generated from a fee structure — record a payment against one to issue a receipt.</p>
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIAL">Partial</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
        {isLoading ? (
          <div className="h-40 bg-surface-2 animate-pulse" />
        ) : error ? (
          <p className="p-8 text-center text-sm text-rose-700">Could not load student fees.</p>
        ) : data && data.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {data.data.map((f) => (
              <StudentFeeRow key={f.id} fee={f} expanded={expandedId === f.id} onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)} />
            ))}
          </ul>
        ) : (
          <p className="p-10 text-center text-sm text-muted">No charges match this filter yet.</p>
        )}
      </div>
    </div>
  );
}

function StudentFeeRow({ fee, expanded, onToggle }: { fee: StudentFeeWithDetails; expanded: boolean; onToggle: () => void }) {
  const remaining = fee.amountDue - fee.amountPaid;

  return (
    <li>
      <div className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {fee.student.firstName} {fee.student.lastName}
            {fee.student.admissionNo ? <span className="text-muted font-normal"> · {fee.student.admissionNo}</span> : null}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {fee.feeStructure.name} — {fee.feeItem.label} · due {new Date(fee.feeItem.dueDate).toLocaleDateString()}
            {fee.isOverdue && <span className="text-rose-600 font-medium"> · overdue</span>}
          </p>
          <p className="text-sm text-ink mt-1">
            ₹{fee.amountPaid.toLocaleString()} <span className="text-muted">of</span> ₹{fee.amountDue.toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[fee.status] ?? ""}`}>{fee.status}</span>
          {fee.status !== "PAID" && (
            <button type="button" onClick={onToggle} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
              <Icon name="payments" size={16} />
              {expanded ? "Cancel" : "Record payment"}
            </button>
          )}
        </div>
      </div>
      {expanded && <RecordPaymentForm studentFeeId={fee.id} remaining={remaining} onDone={onToggle} />}
    </li>
  );
}

function RecordPaymentForm({ studentFeeId, remaining, onDone }: { studentFeeId: string; remaining: number; onDone: () => void }) {
  const [recordPayment, { isLoading }] = useRecordPaymentMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<PaymentWithDetails | null>(null);
  // One key per form open, reused across a retried submit — the server
  // treats a repeat with this same key as a replay, never a second charge.
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecordPaymentInput>({ resolver: zodResolver(recordPaymentSchema), defaultValues: { studentFeeId, amount: remaining, method: "CASH" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const res = await recordPayment({ body: { ...values, studentFeeId }, idempotencyKey }).unwrap();
      setReceipt(res.data);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (receipt) {
    return (
      <div className="px-5 py-4 border-t border-line bg-emerald-50/60 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-emerald-800">Payment recorded — receipt {receipt.receipt.receiptNo}</p>
          <p className="text-xs text-emerald-700 mt-0.5">
            ₹{receipt.amount.toLocaleString()} via {METHOD_LABEL[receipt.method] ?? receipt.method} · {new Date(receipt.paidAt).toLocaleString()}
          </p>
        </div>
        <button type="button" onClick={onDone} className="text-sm font-semibold text-emerald-800 hover:underline">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="px-5 py-4 border-t border-line bg-surface-2/40 grid gap-3 sm:grid-cols-[140px_180px_1fr_auto] items-end">
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-ink">Amount</label>
        <input type="number" step="0.01" max={remaining} {...register("amount", { valueAsNumber: true })} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
        {errors.amount && <p className="text-xs text-rose-600">{errors.amount.message}</p>}
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-ink">Method</label>
        <select {...register("method")} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm">
          {Object.entries(METHOD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-ink">
          Reference <span className="text-muted font-normal">(optional)</span>
        </label>
        <input {...register("reference")} placeholder="Cheque no. / transaction id" className="rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={isLoading} className="rounded-lg bg-accent text-accent-ink text-sm font-semibold px-4 py-2 hover:bg-accent-strong disabled:opacity-60">
        {isLoading ? "Recording…" : "Record"}
      </button>
      {formError && <p className="sm:col-span-4 text-xs text-rose-600">{formError}</p>}
    </form>
  );
}

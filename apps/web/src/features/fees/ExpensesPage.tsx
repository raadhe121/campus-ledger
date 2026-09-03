import { useState } from "react";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema, type CreateExpenseInput } from "@campus-ledger/validation-schemas";
import type { RootState } from "../../app/store";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useListExpensesQuery, useCreateExpenseMutation, useDeleteExpenseMutation } from "./feesApi";

// §07: ACCOUNTANT gets Manage here, SCHOOL_ADMIN drops to R — the one
// module in this phase where their scope doesn't match fees/payments'
// shared Manage. One page for both; the write UI just doesn't render for
// School Admin, and the server enforces the same boundary either way.
export function ExpensesPage() {
  const role = useSelector((state: RootState) => state.auth.user?.role);
  const canManage = role === "ACCOUNTANT";
  const { data, isLoading, error } = useListExpensesQuery({ limit: 100 });
  const [remove, { isLoading: deleting }] = useDeleteExpenseMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  const total = (data?.data ?? []).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Fees</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Expenses</h1>
        <p className="text-sm text-muted mt-1">{canManage ? "Vendor payments, utilities, supplies." : "Read-only — Accountant manages this."}</p>
      </div>

      <div className={`grid gap-6 items-start ${canManage ? "lg:grid-cols-[1fr_340px]" : ""}`}>
        <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
          {isLoading ? (
            <div className="h-40 bg-surface-2 animate-pulse" />
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load expenses.</p>
          ) : data && data.data.length > 0 ? (
            <>
              <ul className="divide-y divide-line">
                {data.data.map((e) => (
                  <li key={e.id} className="p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{e.category}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {e.vendor ? `${e.vendor} · ` : ""}
                        {new Date(e.date).toLocaleDateString()} · recorded by {e.recordedBy.firstName} {e.recordedBy.lastName}
                      </p>
                      {e.description && <p className="text-sm text-muted mt-1">{e.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-ink">₹{e.amount.toLocaleString()}</span>
                      {canManage && (
                        <button
                          type="button"
                          disabled={deleting}
                          onClick={async () => {
                            setRowError(null);
                            try {
                              await remove(e.id).unwrap();
                            } catch (err) {
                              setRowError(apiErrorMessage(err));
                            }
                          }}
                          className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-60"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="px-5 py-3 border-t border-line bg-surface-2/40 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Total</span>
                <span className="text-sm font-semibold text-ink">₹{total.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <p className="p-10 text-center text-sm text-muted">No expenses recorded yet.</p>
          )}
          {rowError && <p className="px-5 py-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{rowError}</p>}
        </div>

        {canManage && <CreateExpenseForm />}
      </div>
    </div>
  );
}

function CreateExpenseForm() {
  const [createExpense, { isLoading }] = useCreateExpenseMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseInput>({ resolver: zodResolver(createExpenseSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createExpense(values).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="bg-surface border border-line rounded-xl p-5 card-shadow grid gap-4 sticky top-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">New expense</p>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Category</label>
        <input {...register("category")} placeholder="Utilities" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        {errors.category && <p className="text-xs text-rose-600">{errors.category.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Amount</label>
        <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        {errors.amount && <p className="text-xs text-rose-600">{errors.amount.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">
          Vendor <span className="text-muted font-normal">(optional)</span>
        </label>
        <input {...register("vendor")} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Date</label>
        <input type="date" {...register("date")} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        {errors.date && <p className="text-xs text-rose-600">{errors.date.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">
          Description <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea {...register("description")} rows={3} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{formError}</p>}

      <button type="submit" disabled={isLoading} className="rounded-lg bg-accent text-accent-ink font-semibold text-sm py-2.5 hover:bg-accent-strong disabled:opacity-60 shadow-sm transition-colors">
        {isLoading ? "Recording…" : "Record expense"}
      </button>
    </form>
  );
}

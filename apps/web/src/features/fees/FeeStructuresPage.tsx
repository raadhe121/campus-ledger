import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFeeStructureSchema, createFeeItemSchema, type CreateFeeStructureInput, type CreateFeeItemInput } from "@campus-ledger/validation-schemas";
import type { FeeStructureWithDetails } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { useListAcademicYearsQuery, useListClassesQuery } from "../academics/academicsApi";
import {
  useListFeeStructuresQuery,
  useCreateFeeStructureMutation,
  useDeleteFeeStructureMutation,
  useCreateFeeItemMutation,
  useDeleteFeeItemMutation,
  useGenerateStudentFeesMutation,
} from "./feesApi";

const FREQUENCY_LABEL: Record<string, string> = {
  ONE_TIME: "One-time",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half-yearly",
  ANNUAL: "Annual",
};

export function FeeStructuresPage() {
  const { data, isLoading, error } = useListFeeStructuresQuery({ limit: 100 });

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Fees</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Fee structures</h1>
        <p className="text-sm text-muted mt-1">Build a fee plan for a class, add its line items, then generate charges for every enrolled student.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="space-y-4">
          {isLoading ? (
            <div className="h-40 rounded-xl bg-surface-2 animate-pulse" />
          ) : error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load fee structures.</p>
          ) : data && data.data.length > 0 ? (
            data.data.map((s) => <FeeStructureCard key={s.id} structure={s} />)
          ) : (
            <p className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted card-shadow">No fee structures yet — create one to get started.</p>
          )}
        </div>

        <CreateFeeStructureForm />
      </div>
    </div>
  );
}

function FeeStructureCard({ structure }: { structure: FeeStructureWithDetails }) {
  const [deleteStructure, { isLoading: deleting }] = useDeleteFeeStructureMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 border-b border-line">
        <div>
          <p className="text-sm font-semibold text-ink">{structure.name}</p>
          <p className="text-xs text-muted mt-0.5">
            {structure.class.name} · {structure.academicYear.label} · {FREQUENCY_LABEL[structure.frequency] ?? structure.frequency}
          </p>
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            setRowError(null);
            try {
              await deleteStructure(structure.id).unwrap();
            } catch (err) {
              setRowError(apiErrorMessage(err));
            }
          }}
          className="text-sm font-medium text-rose-600 hover:underline disabled:opacity-60"
        >
          Delete
        </button>
      </div>

      {structure.items.length > 0 && (
        <ul className="divide-y divide-line">
          {structure.items.map((item) => (
            <FeeItemRow key={item.id} item={item} feeStructureId={structure.id} />
          ))}
        </ul>
      )}

      {rowError && <p className="px-5 py-2.5 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{rowError}</p>}

      <AddFeeItemForm feeStructureId={structure.id} />
    </div>
  );
}

function FeeItemRow({ item, feeStructureId }: { item: FeeStructureWithDetails["items"][number]; feeStructureId: string }) {
  const [generate, { isLoading: generating }] = useGenerateStudentFeesMutation();
  const [deleteItem, { isLoading: deleting }] = useDeleteFeeItemMutation();
  const [message, setMessage] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <li className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-ink">{item.label}</p>
        <p className="text-xs text-muted mt-0.5">
          ₹{item.amount.toLocaleString()} · due {new Date(item.dueDate).toLocaleDateString()}
        </p>
        {message && <p className="text-xs text-emerald-700 mt-0.5">{message}</p>}
        {rowError && <p className="text-xs text-rose-600 mt-0.5">{rowError}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          disabled={generating}
          onClick={async () => {
            setMessage(null);
            setRowError(null);
            try {
              const res = await generate({ feeItemId: item.id, feeStructureId }).unwrap();
              setMessage(`${res.data.created} charged, ${res.data.alreadyAssigned} already had it.`);
            } catch (err) {
              setRowError(apiErrorMessage(err));
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent-soft text-accent-strong text-xs font-semibold px-3 py-1.5 hover:brightness-95 disabled:opacity-60"
        >
          <Icon name="playlist_add_check" size={15} />
          {generating ? "Generating…" : "Generate charges"}
        </button>
        <button
          type="button"
          disabled={deleting}
          onClick={async () => {
            setRowError(null);
            try {
              await deleteItem({ feeItemId: item.id, feeStructureId }).unwrap();
            } catch (err) {
              setRowError(apiErrorMessage(err));
            }
          }}
          className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function AddFeeItemForm({ feeStructureId }: { feeStructureId: string }) {
  const [createItem, { isLoading }] = useCreateFeeItemMutation();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFeeItemInput>({ resolver: zodResolver(createFeeItemSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createItem({ feeStructureId, body: values }).unwrap();
      reset();
      setOpen(false);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="w-full px-5 py-3 text-left text-sm font-medium text-accent hover:bg-surface-2 transition-colors">
        + Add a line item
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="px-5 py-4 border-t border-line grid gap-3 sm:grid-cols-[1fr_140px_160px_auto] items-end bg-surface-2/40">
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-ink">Label</label>
        <input {...register("label")} placeholder="Q1 Tuition" className="rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
        {errors.label && <p className="text-xs text-rose-600">{errors.label.message}</p>}
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-ink">Amount</label>
        <input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
        {errors.amount && <p className="text-xs text-rose-600">{errors.amount.message}</p>}
      </div>
      <div className="grid gap-1">
        <label className="text-xs font-semibold text-ink">Due date</label>
        <input type="date" {...register("dueDate")} className="rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
        {errors.dueDate && <p className="text-xs text-rose-600">{errors.dueDate.message}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={isLoading} className="rounded-lg bg-accent text-accent-ink text-xs font-semibold px-3.5 py-2 hover:bg-accent-strong disabled:opacity-60">
          {isLoading ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-medium text-muted hover:underline">
          Cancel
        </button>
      </div>
      {formError && <p className="sm:col-span-4 text-xs text-rose-600">{formError}</p>}
    </form>
  );
}

function CreateFeeStructureForm() {
  const { data: yearsRes } = useListAcademicYearsQuery();
  const years = yearsRes?.data ?? [];
  const activeYearId = years.find((y) => y.isActive)?.id ?? years[0]?.id ?? "";
  const { data: classesRes } = useListClassesQuery(activeYearId ? { academicYearId: activeYearId } : undefined, { skip: !activeYearId });
  const classes = classesRes?.data ?? [];

  const [createStructure, { isLoading }] = useCreateFeeStructureMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFeeStructureInput>({ resolver: zodResolver(createFeeStructureSchema), defaultValues: { academicYearId: activeYearId, frequency: "ONE_TIME" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await createStructure(values).unwrap();
      reset({ academicYearId: activeYearId, frequency: "ONE_TIME", classId: "", name: "" });
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (years.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
        <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <Icon name="hourglass_empty" size={20} />
        </span>
        <p className="text-sm text-amber-900">No academic year exists yet — School Admin sets one up first.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="bg-surface border border-line rounded-xl p-5 card-shadow grid gap-4 sticky top-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">New fee structure</p>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Academic year</label>
        <select {...register("academicYearId")} defaultValue={activeYearId} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm">
          {years.map((y) => (
            <option key={y.id} value={y.id}>
              {y.label}
              {y.isActive ? " · active" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Class</label>
        <select {...register("classId")} defaultValue="" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm">
          <option value="" disabled>
            — select —
          </option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.classId && <p className="text-xs text-rose-600">Pick a class.</p>}
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Name</label>
        <input {...register("name")} placeholder="Grade 5 Tuition" className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm" />
        {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs font-semibold text-ink">Frequency</label>
        <select {...register("frequency")} className="rounded-lg border border-line bg-paper px-3.5 py-2.5 text-sm">
          {Object.entries(FREQUENCY_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5">{formError}</p>}

      <button type="submit" disabled={isLoading} className="rounded-lg bg-accent text-accent-ink font-semibold text-sm py-2.5 hover:bg-accent-strong disabled:opacity-60 shadow-sm transition-colors">
        {isLoading ? "Creating…" : "Create structure"}
      </button>
    </form>
  );
}

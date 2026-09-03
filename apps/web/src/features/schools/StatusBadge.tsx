import type { SchoolStatus } from "@campus-ledger/shared-types";

const STYLES: Record<SchoolStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  INACTIVE: "bg-surface-3 text-muted ring-1 ring-black/5",
  SUSPENDED: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
};

const DOT: Record<SchoolStatus, string> = {
  ACTIVE: "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.5)]",
  INACTIVE: "bg-slate-400",
  SUSPENDED: "bg-rose-500 shadow-[0_0_6px_1px_rgba(244,63,94,0.5)]",
};

const LABELS: Record<SchoolStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

export function StatusBadge({ status }: { status: SchoolStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]} ${status === "ACTIVE" ? "animate-pulse" : ""}`} />
      {LABELS[status]}
    </span>
  );
}

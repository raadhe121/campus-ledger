import type { UserStatus } from "@campus-ledger/shared-types";

const STYLES: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15",
  PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/15",
  DISABLED: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/15",
};

const DOT: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-500 shadow-[0_0_6px_1px_rgba(16,185,129,0.5)]",
  PENDING: "bg-amber-500",
  DISABLED: "bg-rose-500",
};

export function PersonStatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-widest ${STYLES[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[status]} ${status === "ACTIVE" ? "animate-pulse" : ""}`} />
      {status}
    </span>
  );
}

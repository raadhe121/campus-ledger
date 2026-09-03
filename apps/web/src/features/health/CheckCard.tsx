import type { ReactNode } from "react";

interface CheckCardProps {
  label: string;
  isLoading: boolean;
  isError: boolean;
  errorHint: ReactNode;
  onRetry: () => void;
  children: ReactNode;
}

export function CheckCard({ label, isLoading, isError, errorHint, onRetry, children }: CheckCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 card-shadow relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-60" />
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-muted">{label}</span>
        <span className={`h-2 w-2 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : isError ? "bg-rose-500" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-24 rounded-full bg-surface-2 animate-pulse" />
          <div className="h-3 w-full rounded-full bg-surface-2 animate-pulse" />
          <div className="h-3 w-3/4 rounded-full bg-surface-2 animate-pulse" />
        </div>
      ) : isError ? (
        <div>
          <p className="flex items-center gap-2 text-rose-700 font-semibold mb-1.5 text-sm">⛔ {label} unreachable</p>
          <p className="text-sm leading-5 text-muted bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{errorHint}</p>
        </div>
      ) : (
        children
      )}

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2 transition-colors"
      >
        ↻ Re-check
      </button>
    </div>
  );
}

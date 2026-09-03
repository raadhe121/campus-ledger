import { Link } from "react-router-dom";
import { Icon } from "./Icon";

export interface StatCardProps {
  label: string;
  /** `undefined` renders the loading placeholder — same "still fetching" convention every dashboard already used before this component existed. */
  value: string | number | undefined;
  icon: string;
  /** A `from-X to-Y` Tailwind gradient stop pair — kept per-card (not per-page) since one dashboard often mixes several, e.g. Super Admin's total/active/inactive/suspended row. */
  gradient: string;
  /** An `rgba(...)` string for the icon badge's glow shadow — pick something in the same hue family as `gradient`. */
  glow?: string;
  /** When set, the whole card is a Link and shows a trailing arrow on hover. */
  to?: string;
  hint?: string;
}

/**
 * The gradient-topped, gradient-icon stat tile used across every portal's
 * dashboard (first introduced for Super Admin, §UI-enhance) — one
 * implementation instead of five near-identical bespoke ones, so a future
 * tweak (spacing, animation, loading state) lands everywhere at once.
 */
export function StatCard({ label, value, icon, gradient, glow, to, hint }: StatCardProps) {
  const inner = (
    <>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${gradient} shrink-0`} style={glow ? { boxShadow: `0 8px 20px -6px ${glow}` } : undefined}>
          <Icon name={icon} size={20} filled />
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-ink font-mono mt-4 tabular-nums">{value ?? "–"}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
      {to && <Icon name="arrow_forward" size={16} className="absolute bottom-5 right-5 text-muted opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />}
    </>
  );

  const className = "group relative bg-surface border border-line rounded-2xl p-5 card-shadow card-shadow-hover hover:-translate-y-0.5 transition-all overflow-hidden block";

  return to ? (
    <Link to={to} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

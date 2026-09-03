import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface PortalHeroProps {
  eyebrow: string;
  eyebrowIcon?: string;
  title: string;
  subtitle: ReactNode;
  /** A `from-X to-Y` Tailwind gradient — drives the two soft background blooms; keep it in the same family as the page's StatCard gradients. */
  gradient: string;
  /** Usually a single CTA button, rendered top-right on wide screens. */
  action?: ReactNode;
}

/**
 * The gradient-bloom header every portal's dashboard opens with (first
 * introduced for Super Admin) — a shared shell so each role's home screen
 * reads as "the same product, its own color," rather than one polished
 * page next to four plain ones.
 */
export function PortalHero({ eyebrow, eyebrowIcon = "auto_awesome", title, subtitle, gradient, action }: PortalHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 sm:p-8 card-shadow">
      <div className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br ${gradient} opacity-20 blur-3xl`} />
      <div className={`pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-gradient-to-tr ${gradient} opacity-10 blur-3xl`} />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gold">
            <Icon name={eyebrowIcon} size={16} filled />
            {eyebrow}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mt-1">{title}</h1>
          <div className="text-sm text-muted mt-1.5 max-w-md">{subtitle}</div>
        </div>
        {action}
      </div>
    </div>
  );
}

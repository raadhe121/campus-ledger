import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { TrendBarChart } from "../../components/charts/TrendBarChart";
import { RankedBarList } from "../../components/charts/RankedBarList";
import { useGetFinancialReportQuery } from "./reportsApi";

const GRADIENT = "from-emerald-500 to-teal-600";
const GLOW = "rgba(16,185,129,0.35)";
const EMERALD = "#10b981";
const ROSE = "#f43f5e";

export function AccountantReportsPage() {
  const { data, isLoading, error } = useGetFinancialReportQuery();
  const report = data?.data;

  return (
    <div className="space-y-6">
      <PortalHero eyebrow="Accountant" eyebrowIcon="query_stats" title="Reports" gradient={GRADIENT} subtitle="Collections and expenses over time, and where the money's going." />

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load the financial report.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="account_balance_wallet" label="Collected" value={isLoading ? undefined : `₹${report!.totalCollected.toLocaleString()}`} gradient={GRADIENT} glow={GLOW} />
            <StatCard icon="pending_actions" label="Outstanding" value={isLoading ? undefined : `₹${report!.totalOutstanding.toLocaleString()}`} gradient="from-amber-500 to-orange-600" glow="rgba(217,119,6,0.35)" />
            <StatCard icon="event_busy" label="Overdue charges" value={isLoading ? undefined : report!.overdueCount} gradient="from-rose-500 to-red-600" glow="rgba(244,63,94,0.35)" />
            <StatCard icon="receipt_long" label="Expenses" value={isLoading ? undefined : `₹${report!.totalExpenses.toLocaleString()}`} gradient={GRADIENT} glow={GLOW} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Collected</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Per month, last 6 months.</p>
              {isLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <TrendBarChart data={report!.collectionByMonth} color={EMERALD} formatValue={(v) => `₹${v.toLocaleString()}`} />}
            </section>

            <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
              <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Expenses</h2>
              <p className="text-xs text-muted mt-0.5 mb-5">Per month, last 6 months.</p>
              {isLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <TrendBarChart data={report!.expensesByMonth} color={ROSE} formatValue={(v) => `₹${v.toLocaleString()}`} />}
            </section>
          </div>

          <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
            <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Expenses by category</h2>
            <p className="text-xs text-muted mt-0.5 mb-5">Largest first — more than six categories fold the tail into "Other."</p>
            {isLoading ? <div className="h-36 rounded-lg bg-surface-2 animate-pulse" /> : <RankedBarList data={report!.expensesByCategory} color={EMERALD} formatValue={(v) => `₹${v.toLocaleString()}`} emptyLabel="No expenses recorded yet." />}
          </section>
        </>
      )}
    </div>
  );
}

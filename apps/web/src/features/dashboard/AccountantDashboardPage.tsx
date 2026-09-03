import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { RootState } from "../../app/store";
import { Icon } from "../../components/Icon";
import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { useListStudentFeesQuery, useListExpensesQuery } from "../fees/feesApi";

const GRADIENT = "from-emerald-500 to-teal-600";
const GLOW = "rgba(16,185,129,0.35)";

export function AccountantDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const { data: feesRes, isLoading: feesLoading } = useListStudentFeesQuery({ limit: 200 });
  const { data: expensesRes, isLoading: expensesLoading } = useListExpensesQuery({ limit: 200 });

  const fees = feesRes?.data ?? [];
  const outstanding = fees.filter((f) => f.status !== "PAID").reduce((sum, f) => sum + (f.amountDue - f.amountPaid), 0);
  const overdueCount = fees.filter((f) => f.isOverdue).length;
  const collected = fees.reduce((sum, f) => sum + f.amountPaid, 0);
  const totalExpenses = (expensesRes?.data ?? []).reduce((sum, e) => sum + e.amount, 0);

  const isLoading = feesLoading || expensesLoading;

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="Accountant"
        eyebrowIcon="account_balance"
        title={`Welcome back, ${user?.firstName}!`}
        gradient={GRADIENT}
        subtitle="Fee structures, student charges, payments and expenses — all in one place."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="account_balance_wallet" label="Collected" value={isLoading ? undefined : `₹${collected.toLocaleString()}`} gradient={GRADIENT} glow={GLOW} />
        <StatCard icon="pending_actions" label="Outstanding" value={isLoading ? undefined : `₹${outstanding.toLocaleString()}`} gradient="from-amber-500 to-orange-600" glow="rgba(217,119,6,0.35)" />
        <StatCard icon="event_busy" label="Overdue charges" value={isLoading ? undefined : overdueCount} gradient="from-rose-500 to-red-600" glow="rgba(244,63,94,0.35)" />
        <StatCard icon="receipt_long" label="Expenses recorded" value={isLoading ? undefined : `₹${totalExpenses.toLocaleString()}`} gradient={GRADIENT} glow={GLOW} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink to="/accountant/fee-structures" icon="request_quote" label="Fee structures" hint="Build a plan, add items, generate charges" />
        <QuickLink to="/accountant/student-fees" icon="payments" label="Student fees" hint="Record a payment, issue a receipt" />
        <QuickLink to="/accountant/expenses" icon="receipt_long" label="Expenses" hint="Vendor payments, utilities, supplies" />
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label, hint }: { to: string; icon: string; label: string; hint: string }) {
  return (
    <Link to={to} className="group bg-surface border border-line rounded-2xl p-5 card-shadow card-shadow-hover hover:-translate-y-0.5 transition-all flex items-start gap-3">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${GRADIENT} shrink-0`} style={{ boxShadow: `0 8px 20px -6px ${GLOW}` }}>
        <Icon name={icon} size={20} filled />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-muted mt-0.5">{hint}</p>
      </div>
      <Icon name="arrow_forward" size={16} className="ml-auto mt-1.5 text-muted group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}

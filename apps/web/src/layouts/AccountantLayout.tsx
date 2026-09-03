import { AppShell, type NavItem } from "./AppShell";

const NAV: NavItem[] = [
  { to: "/accountant", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/accountant/fee-structures", label: "Fee structures", icon: "request_quote" },
  { to: "/accountant/student-fees", label: "Student fees", icon: "payments" },
  { to: "/accountant/expenses", label: "Expenses", icon: "receipt_long" },
  { to: "/accountant/reports", label: "Reports", icon: "query_stats" },
];

export function AccountantLayout() {
  return <AppShell roleLabel="Accountant" nav={NAV} theme="emerald" />;
}

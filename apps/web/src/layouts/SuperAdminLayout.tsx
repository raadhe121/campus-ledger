import { AppShell, type NavItem } from "./AppShell";

const NAV: NavItem[] = [
  { to: "/super-admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/super-admin/schools", label: "Schools", icon: "apartment" },
  { to: "/super-admin/reports", label: "Reports", icon: "monitoring" },
  { to: "/super-admin/settings", label: "Settings", icon: "settings" },
];

export function SuperAdminLayout() {
  return <AppShell roleLabel="Super Admin" nav={NAV} dark />;
}

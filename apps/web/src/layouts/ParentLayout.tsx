import { AppShell, type NavItem } from "./AppShell";

const NAV: NavItem[] = [
  { to: "/parent", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/parent/attendance", label: "Attendance", icon: "event_available" },
  { to: "/parent/timetable", label: "Timetable", icon: "schedule" },
  { to: "/parent/results", label: "Results", icon: "military_tech" },
  { to: "/parent/assignments", label: "Assignments", icon: "assignment" },
  { to: "/parent/fees", label: "Fees", icon: "payments" },
  { to: "/parent/subjects", label: "Subjects", icon: "auto_stories" },
];

export function ParentLayout() {
  return <AppShell roleLabel="Parent" nav={NAV} theme="rose" />;
}

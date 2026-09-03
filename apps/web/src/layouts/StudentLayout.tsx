import { AppShell, type NavItem } from "./AppShell";

const NAV: NavItem[] = [
  { to: "/student", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/student/attendance", label: "Attendance", icon: "event_available" },
  { to: "/student/timetable", label: "Timetable", icon: "schedule" },
  { to: "/student/results", label: "Results", icon: "military_tech" },
  { to: "/student/assignments", label: "Assignments", icon: "assignment" },
  { to: "/student/fees", label: "Fees", icon: "payments" },
  { to: "/student/subjects", label: "Subjects", icon: "auto_stories" },
];

export function StudentLayout() {
  return <AppShell roleLabel="Student" nav={NAV} theme="sky" />;
}

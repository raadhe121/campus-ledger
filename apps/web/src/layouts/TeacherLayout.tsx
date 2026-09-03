import { AppShell, type NavItem } from "./AppShell";

const NAV: NavItem[] = [
  { to: "/teacher", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/teacher/attendance", label: "Mark Attendance", icon: "fact_check" },
  { to: "/teacher/timetable", label: "Timetable", icon: "schedule" },
  { to: "/teacher/marks", label: "Enter Marks", icon: "edit_note" },
  { to: "/teacher/assignments", label: "Assignments", icon: "assignment" },
  { to: "/teacher/reports", label: "Reports", icon: "query_stats" },
  { to: "/teacher/subjects", label: "Subjects", icon: "auto_stories" },
];

export function TeacherLayout() {
  return <AppShell roleLabel="Teacher" nav={NAV} theme="amber" />;
}

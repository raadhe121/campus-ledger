import { AppShell, type NavItem } from "./AppShell";

const NAV: NavItem[] = [
  { to: "/school-admin", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/school-admin/academic-years", label: "Academic years", icon: "calendar_month" },
  { to: "/school-admin/classes", label: "Classes", icon: "menu_book" },
  { to: "/school-admin/sections", label: "Sections", icon: "layers" },
  { to: "/school-admin/subjects", label: "Subjects", icon: "auto_stories" },
  { to: "/school-admin/timetable", label: "Timetable", icon: "schedule" },
  { to: "/school-admin/exams", label: "Exams", icon: "quiz" },
  { to: "/school-admin/assignments", label: "Assignments", icon: "assignment" },
  { to: "/school-admin/fee-structures", label: "Fee structures", icon: "request_quote" },
  { to: "/school-admin/student-fees", label: "Student fees", icon: "payments" },
  { to: "/school-admin/expenses", label: "Expenses", icon: "receipt_long" },
  { to: "/school-admin/teachers", label: "Teachers", icon: "groups" },
  { to: "/school-admin/students", label: "Students", icon: "school" },
  { to: "/school-admin/parents", label: "Parents", icon: "family_restroom" },
  { to: "/school-admin/staff", label: "Staff", icon: "badge" },
  { to: "/school-admin/enrollment", label: "Enrollment", icon: "how_to_reg" },
  { to: "/school-admin/reports", label: "Reports", icon: "query_stats" },
  { to: "/school-admin/website", label: "Website", icon: "language" },
  { to: "/school-admin/settings", label: "Settings", icon: "settings" },
];

export function SchoolAdminLayout() {
  return <AppShell roleLabel="School Admin" nav={NAV} theme="indigo" />;
}

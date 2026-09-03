import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "../layouts/RootLayout";
import { SuperAdminLayout } from "../layouts/SuperAdminLayout";
import { SchoolAdminLayout } from "../layouts/SchoolAdminLayout";
import { StatusPage } from "../features/health/StatusPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RequireAuth, RequireRole } from "../routes/guards";
import { RoleRedirect } from "../routes/RoleRedirect";
import { ForbiddenPage, ComingSoonPage } from "../routes/InfoPages";
import { SettingsPlaceholderPage } from "../routes/SettingsPlaceholderPage";
import { SchoolsListPage } from "../features/schools/SchoolsListPage";
import { CreateSchoolPage } from "../features/schools/CreateSchoolPage";
import { SchoolDetailPage } from "../features/schools/SchoolDetailPage";
import { AudioToTextPage } from "../features/dev-tools/AudioToTextPage";
import { SchoolAdminDashboardPage } from "../features/dashboard/SchoolAdminDashboardPage";
import { SuperAdminDashboardPage } from "../features/dashboard/SuperAdminDashboardPage";
import { StudentLayout } from "../layouts/StudentLayout";
import { StudentDashboardPage } from "../features/dashboard/StudentDashboardPage";
import { TeacherLayout } from "../layouts/TeacherLayout";
import { TeacherDashboardPage } from "../features/dashboard/TeacherDashboardPage";
import { AcademicYearsPage } from "../features/academics/AcademicYearsPage";
import { ClassesPage } from "../features/academics/ClassesPage";
import { SectionsPage } from "../features/academics/SectionsPage";
import { SubjectsPage } from "../features/academics/SubjectsPage";
import { SubjectsReadOnlyPage } from "../features/academics/SubjectsReadOnlyPage";
import { TeachersPage } from "../features/people/TeachersPage";
import { StudentsPage } from "../features/people/StudentsPage";
import { ParentsPage } from "../features/people/ParentsPage";
import { StaffPage } from "../features/people/StaffPage";
import { EnrollmentPage } from "../features/enrollment/EnrollmentPage";
import { DesignsPage } from "../features/designs/DesignsPage";
import { TimetablePage } from "../features/timetable/TimetablePage";
import { MarkAttendancePage } from "../features/attendance/MarkAttendancePage";
import { TeacherTimetablePage } from "../features/dashboard/TeacherTimetablePage";
import { StudentTimetablePage } from "../features/dashboard/StudentTimetablePage";
import { StudentAttendancePage } from "../features/dashboard/StudentAttendancePage";
import { ExamsPage } from "../features/exams/ExamsPage";
import { ExamSubjectsPage } from "../features/exams/ExamSubjectsPage";
import { ExamMarksPage } from "../features/exams/ExamMarksPage";
import { EnterMarksPage } from "../features/exams/EnterMarksPage";
import { AssignmentsReadOnlyPage } from "../features/assignments/AssignmentsReadOnlyPage";
import { TeacherAssignmentsPage } from "../features/assignments/TeacherAssignmentsPage";
import { SubmissionsPage } from "../features/assignments/SubmissionsPage";
import { StudentResultsPage } from "../features/dashboard/StudentResultsPage";
import { StudentAssignmentsPage } from "../features/dashboard/StudentAssignmentsPage";
import { ParentLayout } from "../layouts/ParentLayout";
import { ParentDashboardPage } from "../features/dashboard/ParentDashboardPage";
import { ParentAttendancePage } from "../features/dashboard/ParentAttendancePage";
import { ParentTimetablePage } from "../features/dashboard/ParentTimetablePage";
import { ParentResultsPage } from "../features/dashboard/ParentResultsPage";
import { ParentAssignmentsPage } from "../features/dashboard/ParentAssignmentsPage";
import { AccountantLayout } from "../layouts/AccountantLayout";
import { AccountantDashboardPage } from "../features/dashboard/AccountantDashboardPage";
import { FeeStructuresPage } from "../features/fees/FeeStructuresPage";
import { StudentFeesPage as ManageStudentFeesPage } from "../features/fees/StudentFeesPage";
import { ExpensesPage } from "../features/fees/ExpensesPage";
import { StudentFeesPage } from "../features/dashboard/StudentFeesPage";
import { ParentFeesPage } from "../features/dashboard/ParentFeesPage";
import { SchoolWebsitePage } from "../features/website/SchoolWebsitePage";
import { SuperAdminReportsPage } from "../features/reports/SuperAdminReportsPage";
import { SchoolAdminReportsPage } from "../features/reports/SchoolAdminReportsPage";
import { TeacherReportsPage } from "../features/reports/TeacherReportsPage";
import { AccountantReportsPage } from "../features/reports/AccountantReportsPage";

// One route tree for every role (architecture §09) — RequireRole is what
// diverges, not a separate app. SUPER_ADMIN (Phase 01) and SCHOOL_ADMIN
// (Phase 02) have full management areas. Phase 03 added attendance and
// timetable; Phase 04/05 add exams/marks and assignments/submissions;
// Phase 06 adds fee structures/student fees/payments/receipts/expenses —
// School Admin "Manage"s scheduling (exams, exam subjects) and only "R"s
// assignments, but shares Accountant's full "Manage" on fees/payments and
// drops to "R" only on Expenses; Teacher gets "CRU (own subject)" marks
// entry and "Manage (own)" assignments, both ownership-checked
// server-side against what they actually teach; Student gets "R (self)"
// results/timetable/attendance/fees and "R + submit" assignments. Parent
// gets "R (children)" — the same six reads as Student, fanned out across
// every linked child; every /parent/* page here picks a child first.
export const router = createBrowserRouter([
  { path: "/designs", element: <DesignsPage /> },
  { path: "/status", element: <RootLayout />, children: [{ index: true, element: <StatusPage /> }] },
  { path: "/login", element: <LoginPage /> },
  { path: "/dev/audio-to-text", element: <AudioToTextPage /> },

  {
    element: <RequireAuth />,
    children: [
      { path: "/", element: <RoleRedirect /> },
      { path: "/forbidden", element: <ForbiddenPage /> },
      { path: "/coming-soon", element: <ComingSoonPage /> },

      {
        element: <RequireRole roles={["SUPER_ADMIN"]} />,
        children: [
          {
            path: "/super-admin",
            element: <SuperAdminLayout />,
            children: [
              { index: true, element: <SuperAdminDashboardPage /> },
              { path: "schools", element: <SchoolsListPage /> },
              { path: "schools/new", element: <CreateSchoolPage /> },
              { path: "schools/:schoolId", element: <SchoolDetailPage /> },
              { path: "reports", element: <SuperAdminReportsPage /> },
              { path: "settings", element: <SettingsPlaceholderPage /> },
            ],
          },
        ],
      },

      {
        element: <RequireRole roles={["SCHOOL_ADMIN"]} />,
        children: [
          {
            path: "/school-admin",
            element: <SchoolAdminLayout />,
            children: [
              { index: true, element: <SchoolAdminDashboardPage /> },
              { path: "academic-years", element: <AcademicYearsPage /> },
              { path: "classes", element: <ClassesPage /> },
              { path: "sections", element: <SectionsPage /> },
              { path: "subjects", element: <SubjectsPage /> },
              { path: "timetable", element: <TimetablePage /> },
              { path: "exams", element: <ExamsPage /> },
              { path: "exams/:examId", element: <ExamSubjectsPage /> },
              { path: "exam-subjects/:examSubjectId/marks", element: <ExamMarksPage /> },
              { path: "assignments", element: <AssignmentsReadOnlyPage /> },
              { path: "fee-structures", element: <FeeStructuresPage /> },
              { path: "student-fees", element: <ManageStudentFeesPage /> },
              { path: "expenses", element: <ExpensesPage /> },
              { path: "teachers", element: <TeachersPage /> },
              { path: "students", element: <StudentsPage /> },
              { path: "parents", element: <ParentsPage /> },
              { path: "staff", element: <StaffPage /> },
              { path: "enrollment", element: <EnrollmentPage /> },
              { path: "reports", element: <SchoolAdminReportsPage /> },
              { path: "website", element: <SchoolWebsitePage /> },
              { path: "settings", element: <SettingsPlaceholderPage /> },
            ],
          },
        ],
      },

      {
        element: <RequireRole roles={["STUDENT"]} />,
        children: [
          {
            path: "/student",
            element: <StudentLayout />,
            children: [
              { index: true, element: <StudentDashboardPage /> },
              { path: "attendance", element: <StudentAttendancePage /> },
              { path: "timetable", element: <StudentTimetablePage /> },
              { path: "results", element: <StudentResultsPage /> },
              { path: "assignments", element: <StudentAssignmentsPage /> },
              { path: "fees", element: <StudentFeesPage /> },
              { path: "subjects", element: <SubjectsReadOnlyPage roleLabel="Student" /> },
            ],
          },
        ],
      },

      {
        element: <RequireRole roles={["TEACHER"]} />,
        children: [
          {
            path: "/teacher",
            element: <TeacherLayout />,
            children: [
              { index: true, element: <TeacherDashboardPage /> },
              { path: "attendance", element: <MarkAttendancePage /> },
              { path: "timetable", element: <TeacherTimetablePage /> },
              { path: "marks", element: <EnterMarksPage /> },
              { path: "assignments", element: <TeacherAssignmentsPage /> },
              { path: "assignments/:assignmentId/submissions", element: <SubmissionsPage /> },
              { path: "reports", element: <TeacherReportsPage /> },
              { path: "subjects", element: <SubjectsReadOnlyPage roleLabel="Teacher" /> },
            ],
          },
        ],
      },

      {
        element: <RequireRole roles={["PARENT"]} />,
        children: [
          {
            path: "/parent",
            element: <ParentLayout />,
            children: [
              { index: true, element: <ParentDashboardPage /> },
              { path: "attendance", element: <ParentAttendancePage /> },
              { path: "timetable", element: <ParentTimetablePage /> },
              { path: "results", element: <ParentResultsPage /> },
              { path: "assignments", element: <ParentAssignmentsPage /> },
              { path: "fees", element: <ParentFeesPage /> },
              { path: "subjects", element: <SubjectsReadOnlyPage roleLabel="Parent" /> },
            ],
          },
        ],
      },

      {
        element: <RequireRole roles={["ACCOUNTANT"]} />,
        children: [
          {
            path: "/accountant",
            element: <AccountantLayout />,
            children: [
              { index: true, element: <AccountantDashboardPage /> },
              { path: "fee-structures", element: <FeeStructuresPage /> },
              { path: "student-fees", element: <ManageStudentFeesPage /> },
              { path: "expenses", element: <ExpensesPage /> },
              { path: "reports", element: <AccountantReportsPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

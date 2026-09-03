import { Link } from "react-router-dom";
import { Icon } from "../../components/Icon";
import { PortalHero } from "../../components/PortalHero";
import { StatCard } from "../../components/StatCard";
import { useListAcademicYearsQuery, useListClassesQuery, useListSectionsQuery, useListSubjectsQuery } from "../academics/academicsApi";
import { useListTeachersQuery, useListStudentsQuery, useListParentsQuery, useListStaffQuery } from "../people/peopleApi";
import { useListEnrollmentsQuery } from "../enrollment/enrollmentApi";

const GRADIENT = "from-indigo-500 to-blue-600";
const GLOW = "rgba(99,102,241,0.35)";

const STATS: { label: string; to: string; icon: string; useCount: () => number | undefined }[] = [
  { label: "Academic years", to: "/school-admin/academic-years", icon: "calendar_month", useCount: () => useListAcademicYearsQuery({ page: 1 }).data?.meta.total },
  { label: "Classes", to: "/school-admin/classes", icon: "menu_book", useCount: () => useListClassesQuery({ page: 1 }).data?.meta.total },
  { label: "Sections", to: "/school-admin/sections", icon: "layers", useCount: () => useListSectionsQuery({ page: 1 }).data?.meta.total },
  { label: "Subjects", to: "/school-admin/subjects", icon: "auto_stories", useCount: () => useListSubjectsQuery({ page: 1 }).data?.meta.total },
  { label: "Teachers", to: "/school-admin/teachers", icon: "groups", useCount: () => useListTeachersQuery({ page: 1 }).data?.meta.total },
  { label: "Students", to: "/school-admin/students", icon: "school", useCount: () => useListStudentsQuery({ page: 1 }).data?.meta.total },
  { label: "Parents", to: "/school-admin/parents", icon: "family_restroom", useCount: () => useListParentsQuery({ page: 1 }).data?.meta.total },
  { label: "Staff", to: "/school-admin/staff", icon: "badge", useCount: () => useListStaffQuery({ page: 1 }).data?.meta.total },
  { label: "Enrollments", to: "/school-admin/enrollment", icon: "how_to_reg", useCount: () => useListEnrollmentsQuery({ page: 1 }).data?.meta.total },
];

export function SchoolAdminDashboardPage() {
  const { data: yearsRes } = useListAcademicYearsQuery({ page: 1 });
  const activeYear = yearsRes?.data.find((y) => y.isActive);

  return (
    <div className="space-y-6">
      <PortalHero
        eyebrow="School Admin"
        eyebrowIcon="apartment"
        title="Your school, all in one place"
        gradient={GRADIENT}
        subtitle="Set up in order — academic year → classes → sections → subjects → people → enrollment."
        action={
          !activeYear && (
            <Link
              to="/school-admin/academic-years"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold px-5 py-3 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
            >
              <Icon name="calendar_month" size={20} />
              Create academic year
            </Link>
          )
        }
      />

      {yearsRes && !activeYear && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="warning" size={20} />
          </span>
          <p className="text-sm text-amber-900">
            No active academic year yet.{" "}
            <Link to="/school-admin/academic-years" className="font-semibold underline decoration-amber-500">
              Create one
            </Link>{" "}
            to start setting up classes.
          </p>
        </div>
      )}
      {activeYear && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Icon name="check_circle" size={20} />
          </span>
          <p className="text-sm text-emerald-900">
            Active academic year: <span className="font-bold">{activeYear.label}</span>
            <span className="text-emerald-700/70">
              {" "}
              · {new Date(activeYear.startDate).toLocaleDateString()} – {new Date(activeYear.endDate).toLocaleDateString()}
            </span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {STATS.map((stat) => (
          <StatCardCell key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}

function StatCardCell({ label, to, icon, useCount }: { label: string; to: string; icon: string; useCount: () => number | undefined }) {
  const count = useCount();
  return <StatCard label={label} to={to} icon={icon} value={count} gradient={GRADIENT} glow={GLOW} />;
}

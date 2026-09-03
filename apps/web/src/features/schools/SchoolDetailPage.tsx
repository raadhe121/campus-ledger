import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams } from "react-router-dom";
import type { SchoolStatus } from "@campus-ledger/shared-types";
import { createSchoolAdminSchema, type CreateSchoolAdminInput } from "@campus-ledger/validation-schemas";
import { Icon } from "../../components/Icon";
import { InitialsAvatar } from "../../components/InitialsAvatar";
import { TempPasswordCallout } from "../../components/TempPasswordCallout";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { StatCard } from "../../components/StatCard";
import { useGetSchoolStatsReportQuery } from "../reports/reportsApi";
import { useGetSchoolQuery, useListSchoolAdminsQuery, useSetSchoolStatusMutation, useCreateSchoolAdminMutation } from "./schoolsApi";
import { StatusBadge } from "./StatusBadge";

const STATS_GRADIENT = "from-indigo-400 via-violet-500 to-fuchsia-500";
const STATS_GLOW = "rgba(139,92,246,0.4)";

const STATUS_ACTIONS: { to: SchoolStatus; label: string; icon: string; cls: string }[] = [
  { to: "ACTIVE", label: "Activate", icon: "check_circle", cls: "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5" },
  { to: "INACTIVE", label: "Deactivate", icon: "pause_circle", cls: "border border-line text-ink hover:bg-surface-2" },
  { to: "SUSPENDED", label: "Suspend", icon: "block", cls: "bg-rose-50 text-rose-700 hover:bg-rose-100" },
];

export function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const { data: schoolRes, isLoading } = useGetSchoolQuery(schoolId!);
  const { data: adminsRes } = useListSchoolAdminsQuery(schoolId!);
  const { data: statsRes, isLoading: statsLoading } = useGetSchoolStatsReportQuery(schoolId!);
  const [setStatus, { isLoading: statusChanging }] = useSetSchoolStatusMutation();

  if (isLoading)
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-5 w-24 rounded-full bg-surface-2 animate-pulse" />
        <div className="h-32 rounded-2xl bg-surface-2 animate-pulse" />
      </div>
    );
  if (!schoolRes)
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-medium text-rose-700">School not found.</p>
        <Link to="/super-admin/schools" className="text-xs font-semibold text-rose-700 hover:underline mt-2 inline-block">
          ← Back to schools
        </Link>
      </div>
    );

  const school = schoolRes.data;

  return (
    <div className="max-w-3xl space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted">
        <Link to="/super-admin/schools" className="hover:text-accent transition-colors">
          Schools
        </Link>
        <Icon name="chevron_right" size={14} className="mx-0.5" />
        <span className="text-ink font-medium">{school.name}</span>
      </nav>

      <div className="relative overflow-hidden bg-surface border border-line rounded-2xl p-6 card-shadow">
        <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br from-violet-400/20 to-indigo-400/5 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <InitialsAvatar name={school.name} size={56} rounded="rounded-2xl" />
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{school.name}</h1>
            <p className="text-xs font-mono text-muted mt-0.5">{school.slug}</p>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <StatusBadge status={school.status} />
              <span className="inline-flex rounded-full bg-surface-2 px-2.5 py-1 text-xs font-mono text-muted">{school.plan}</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide mb-3">Statistics</h2>
        {statsLoading || !statsRes ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-surface-2 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="school" label="Students" value={statsRes.data.people.students} gradient={STATS_GRADIENT} glow={STATS_GLOW} />
            <StatCard icon="cast_for_education" label="Teachers" value={statsRes.data.people.teachers} gradient={STATS_GRADIENT} glow={STATS_GLOW} />
            <StatCard
              icon="event_available"
              label="Attendance (30d)"
              value={statsRes.data.attendanceRateLast30Days !== null ? `${statsRes.data.attendanceRateLast30Days}%` : "—"}
              gradient={STATS_GRADIENT}
              glow={STATS_GLOW}
            />
            <StatCard icon="account_balance_wallet" label="Fees collected" value={`₹${statsRes.data.finance.totalCollected.toLocaleString()}`} gradient={STATS_GRADIENT} glow={STATS_GLOW} />
          </div>
        )}
        {statsRes && (
          <p className="text-xs text-muted mt-3">
            {statsRes.data.academics.classes} classes · {statsRes.data.academics.sections} sections · {statsRes.data.people.parents} parents · {statsRes.data.people.staff} staff
            {statsRes.data.academics.activeAcademicYear ? ` · Active year: ${statsRes.data.academics.activeAcademicYear}` : ""}
          </p>
        )}
      </section>

      <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Details</h2>
        <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm bg-paper rounded-xl p-4 border border-line">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Contact</dt>
          <dd className="text-ink font-medium break-all">{school.contactEmail}</dd>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Address</dt>
          <dd className="text-ink">{school.address ?? "—"}</dd>
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Created</dt>
          <dd className="text-ink font-mono text-xs">{new Date(school.createdAt).toLocaleDateString()}</dd>
        </dl>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
          {STATUS_ACTIONS.filter((a) => a.to !== school.status).map((action) => (
            <button
              key={action.to}
              type="button"
              disabled={statusChanging}
              onClick={() => setStatus({ schoolId: school.id, body: { status: action.to } })}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60 transition-all ${action.cls}`}
            >
              <Icon name={action.icon} size={16} />
              {action.label}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-line rounded-2xl p-6 card-shadow">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide">School administrators</h2>
        <p className="text-xs text-muted mt-1">Each school has its own isolated admin accounts.</p>

        {adminsRes && adminsRes.data.length > 0 && (
          <ul className="mt-4 grid gap-2">
            {adminsRes.data.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper px-3.5 py-2.5">
                <span className="flex items-center gap-2.5 text-sm font-medium text-ink min-w-0">
                  <InitialsAvatar name={`${admin.firstName} ${admin.lastName}`} size={30} rounded="rounded-full" />
                  <span className="truncate">
                    {admin.firstName} {admin.lastName}
                  </span>
                </span>
                <span className="text-muted font-mono text-xs break-all shrink-0">{admin.email}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <CreateSchoolAdminForm schoolId={school.id} />
        </div>
      </section>
    </div>
  );
}

function CreateSchoolAdminForm({ schoolId }: { schoolId: string }) {
  const [createAdmin, { isLoading }] = useCreateSchoolAdminMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSchoolAdminInput>({ resolver: zodResolver(createSchoolAdminSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await createAdmin({ schoolId, body: values }).unwrap();
      setCreated({ email: data.user.email, tempPassword: data.tempPassword });
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (created) {
    return <TempPasswordCallout email={created.email} tempPassword={created.tempPassword} onDismiss={() => setCreated(null)} dismissLabel="Add another" />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl bg-paper border border-line p-4 grid gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Add a School Admin</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="firstName" className="text-xs font-medium text-ink">
            First name
          </label>
          <input id="firstName" {...register("firstName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          {errors.firstName && <p className="text-xs text-rose-600">{errors.firstName.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="lastName" className="text-xs font-medium text-ink">
            Last name
          </label>
          <input id="lastName" {...register("lastName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          {errors.lastName && <p className="text-xs text-rose-600">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="admin-email" className="text-xs font-medium text-ink">
          Email
        </label>
        <input id="admin-email" type="email" {...register("email")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        {errors.email && <p className="text-xs text-rose-600">{errors.email.message}</p>}
      </div>

      {formError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="justify-self-start inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-semibold px-5 py-2.5 disabled:opacity-60 shadow-sm hover:shadow-md transition-all"
      >
        {isLoading ? "Creating…" : "Create School Admin"}
        {!isLoading && <Icon name="arrow_forward" size={16} />}
      </button>
    </form>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { createSchoolSchema, type CreateSchoolInput } from "@campus-ledger/validation-schemas";
import { Icon } from "../../components/Icon";
import { useCreateSchoolMutation } from "./schoolsApi";

const NEXT_STEPS = [
  { icon: "shield", title: "A fully isolated tenant", body: "Its own data boundary — no other school can ever see or reach into it." },
  { icon: "person_add", title: "Provision its first School Admin", body: "You'll add them on the very next screen, with a one-time temp password." },
  { icon: "rocket_launch", title: "They take it from there", body: "Academic years, classes, staff, students — all set up inside their own school." },
];

export function CreateSchoolPage() {
  const navigate = useNavigate();
  const [createSchool, { isLoading }] = useCreateSchoolMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSchoolInput>({ resolver: zodResolver(createSchoolSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data: school } = await createSchool(values).unwrap();
      navigate(`/super-admin/schools/${school.id}`);
    } catch (err) {
      const message =
        err && typeof err === "object" && "data" in err
          ? ((err.data as { error?: { message?: string } })?.error?.message ?? "Something went wrong")
          : "Could not reach the server";
      setFormError(message);
    }
  });

  return (
    <div className="max-w-4xl">
      <nav aria-label="Breadcrumb" className="flex items-center text-xs text-muted mb-1">
        <Link to="/super-admin/schools" className="hover:text-accent transition-colors">
          Schools
        </Link>
        <Icon name="chevron_right" size={14} className="mx-0.5" />
        <span className="text-ink font-medium">Add new</span>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight text-ink mb-1">Add New School</h1>
      <p className="text-sm text-muted mb-8">Stands up a new, fully isolated tenant. You'll add its first School Admin next.</p>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="bg-surface border border-line rounded-2xl card-shadow p-6 md:p-8">
          <h2 className="text-lg font-semibold text-ink mb-6 border-b border-line pb-4">Basic information</h2>

          <form onSubmit={onSubmit} noValidate className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-semibold text-muted uppercase tracking-wider">
                  School name <span className="text-danger">*</span>
                </label>
                <input
                  id="name"
                  {...register("name")}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="e.g. Riverside High"
                />
                {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="contactEmail" className="block text-xs font-semibold text-muted uppercase tracking-wider">
                  Primary contact email <span className="text-danger">*</span>
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="admin@riverside.edu"
                />
                {errors.contactEmail && <p className="text-xs text-rose-600">{errors.contactEmail.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="address" className="block text-xs font-semibold text-muted uppercase tracking-wider">
                  Address <span className="text-muted font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="address"
                  {...register("address")}
                  className="w-full px-4 py-2.5 bg-paper border border-line rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  placeholder="123 Main St, Springfield"
                />
              </div>
            </div>

            {formError && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">{formError}</p>}

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-line">
              <Link to="/super-admin/schools" className="px-6 py-2.5 text-sm font-semibold text-accent hover:bg-accent/5 rounded-xl transition-colors">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-600 disabled:opacity-60 rounded-xl shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
              >
                {isLoading ? "Creating…" : "Create school"}
                {!isLoading && <Icon name="arrow_forward" size={18} />}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-gradient-to-b from-[#0f1224] to-[#171a30] rounded-2xl p-6 card-shadow text-white sticky top-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-300">What happens next</p>
          <ul className="mt-5 space-y-5">
            {NEXT_STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <div className="relative shrink-0">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon name={step.icon} size={16} />
                  </div>
                  {i < NEXT_STEPS.length - 1 && <div className="absolute left-1/2 top-8 h-5 w-px -translate-x-1/2 bg-white/15" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

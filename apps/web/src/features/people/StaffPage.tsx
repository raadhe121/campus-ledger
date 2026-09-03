import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createStaffSchema, type CreateStaffInput } from "@campus-ledger/validation-schemas";
import { useListStaffQuery, useCreateStaffMutation, useSetStaffStatusMutation } from "./peopleApi";
import { PersonStatusBadge } from "../../components/PersonStatusBadge";
import { TempPasswordCallout } from "../../components/TempPasswordCallout";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

export function StaffPage() {
  const { data, isLoading, error } = useListStaffQuery();
  const [setStatus, { isLoading: statusChanging }] = useSetStaffStatusMutation();
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">People</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Staff</h1>
        <p className="text-sm text-muted mt-1">Non-teaching staff and accountants — teachers have their own list.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 w-32 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load staff.</p>
          ) : data && data.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                      <th className="px-4 py-3.5">Name</th>
                      <th className="px-4 py-3.5">Email</th>
                      <th className="px-4 py-3.5 hidden sm:table-cell">Role</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {data.data.map(({ user, profile }) => (
                      <tr key={user.id} className="hover:bg-surface-2/40">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center text-xs font-bold">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </div>
                            <span className="font-semibold text-ink">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono text-xs">{user.email}</td>
                        <td className="px-4 py-3.5 text-muted text-xs hidden sm:table-cell">
                          {user.role === "ACCOUNTANT" ? "Accountant" : "Staff"}
                          {profile.designation ? ` · ${profile.designation}` : ""}
                        </td>
                        <td className="px-4 py-3.5">
                          <PersonStatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={statusChanging}
                            onClick={async () => {
                              setRowError(null);
                              try {
                                await setStatus({ userId: user.id, body: { status: user.status === "DISABLED" ? "ACTIVE" : "DISABLED" } }).unwrap();
                              } catch (err) {
                                setRowError(apiErrorMessage(err));
                              }
                            }}
                            className={`rounded-full px-3 py-1 text-xs font-semibold border disabled:opacity-60 ${
                              user.status === "DISABLED"
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-white text-ink border-line hover:bg-surface-2"
                            }`}
                          >
                            {user.status === "DISABLED" ? "Reactivate" : "Deactivate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rowError && <p className="px-4 py-3 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{rowError}</p>}
            </>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">🧑‍💼</div>
              <p className="font-medium text-ink mt-3">No staff yet</p>
              <p className="text-sm text-muted mt-1">Add the first one on the right.</p>
            </div>
          )}
        </div>

        <CreateStaffForm />
      </div>
    </div>
  );
}

function CreateStaffForm() {
  const [createStaff, { isLoading }] = useCreateStaffMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateStaffInput>({ resolver: zodResolver(createStaffSchema), defaultValues: { role: "STAFF" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await createStaff(values).unwrap();
      setCreated({ email: data.user.email, tempPassword: data.tempPassword });
      reset({ role: "STAFF" });
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  if (created) {
    return <TempPasswordCallout email={created.email} tempPassword={created.tempPassword} onDismiss={() => setCreated(null)} />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-5 card-shadow grid gap-4 sticky top-20">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">Add a staff member</p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-role" className="text-xs font-semibold text-ink">
          Role
        </label>
        <select id="s-role" {...register("role")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm">
          <option value="STAFF">Staff</option>
          <option value="ACCOUNTANT">Accountant</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="s-firstName" className="text-xs font-semibold text-ink">
            First name
          </label>
          <input id="s-firstName" {...register("firstName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          {errors.firstName && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.firstName.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="s-lastName" className="text-xs font-semibold text-ink">
            Last name
          </label>
          <input id="s-lastName" {...register("lastName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          {errors.lastName && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-email" className="text-xs font-semibold text-ink">
          Email
        </label>
        <input id="s-email" type="email" {...register("email")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        {errors.email && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.email.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-phone" className="text-xs font-semibold text-ink">
          Phone <span className="text-muted font-normal">(optional)</span>
        </label>
        <input id="s-phone" {...register("phone")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-designation" className="text-xs font-semibold text-ink">
          Designation <span className="text-muted font-normal">(optional)</span>
        </label>
        <input id="s-designation" {...register("designation")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="s-department" className="text-xs font-semibold text-ink">
          Department <span className="text-muted font-normal">(optional)</span>
        </label>
        <input id="s-department" {...register("department")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
      </div>

      {formError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink text-sm font-semibold py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Creating…" : "Add staff member"}
      </button>
    </form>
  );
}

import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createParentSchema, linkParentStudentSchema, type CreateParentInput, type LinkParentStudentInput } from "@campus-ledger/validation-schemas";
import {
  useListParentsQuery,
  useCreateParentMutation,
  useListChildrenQuery,
  useLinkChildMutation,
  useUnlinkChildMutation,
  useListStudentsQuery,
} from "./peopleApi";
import { PersonStatusBadge } from "../../components/PersonStatusBadge";
import { TempPasswordCallout } from "../../components/TempPasswordCallout";
import { apiErrorMessage } from "../../lib/apiErrorMessage";

export function ParentsPage() {
  const { data, isLoading, error } = useListParentsQuery();
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">People</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Parents</h1>
        <p className="text-sm text-muted mt-1">Link each parent to their children — one parent can have several, one student more than one guardian.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
          {isLoading ? (
            <div className="p-6 space-y-3">
              <div className="h-4 w-32 rounded-full bg-surface-2 animate-pulse" />
              <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
            </div>
          ) : error ? (
            <p className="p-8 text-center text-sm text-rose-700">Could not load parents.</p>
          ) : data && data.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {data.data.map((parent) => (
                    <Fragment key={parent.id}>
                      <tr className="hover:bg-surface-2/40">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center text-xs font-bold">
                              {parent.firstName[0]}
                              {parent.lastName[0]}
                            </div>
                            <span className="font-semibold text-ink">
                              {parent.firstName} {parent.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono text-xs">{parent.email}</td>
                        <td className="px-4 py-3.5">
                          <PersonStatusBadge status={parent.status} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setExpanded(expanded === parent.id ? null : parent.id)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                              expanded === parent.id ? "bg-ink text-white border-ink" : "bg-white text-ink border-line hover:bg-surface-2"
                            }`}
                          >
                            {expanded === parent.id ? "Hide" : "Children"}
                          </button>
                        </td>
                      </tr>
                      {expanded === parent.id && (
                        <tr className="bg-surface-2/40">
                          <td colSpan={4} className="px-4 py-4">
                            <ChildrenPanel parentId={parent.id} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">👨‍👩‍👧</div>
              <p className="font-medium text-ink mt-3">No parents yet</p>
              <p className="text-sm text-muted mt-1">Add the first one on the right.</p>
            </div>
          )}
        </div>

        <CreateParentForm />
      </div>
    </div>
  );
}

function ChildrenPanel({ parentId }: { parentId: string }) {
  const { data: linksRes, isLoading } = useListChildrenQuery(parentId);
  const { data: studentsRes } = useListStudentsQuery();
  const [linkChild, { isLoading: linking }] = useLinkChildMutation();
  const [unlinkChild] = useUnlinkChildMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const links = linksRes?.data ?? [];
  const linkedStudentIds = new Set(links.map((l) => l.studentId));
  const availableStudents = (studentsRes?.data ?? []).filter((s) => !linkedStudentIds.has(s.user.id));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LinkParentStudentInput>({ resolver: zodResolver(linkParentStudentSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await linkChild({ parentId, body: values }).unwrap();
      reset();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <div className="grid gap-3 max-w-xl">
      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : links.length > 0 ? (
        <ul className="grid gap-2">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between text-sm border border-line rounded-xl px-3 py-2.5 bg-surface">
              <span className="text-ink font-medium">
                {link.student.firstName} {link.student.lastName}
                <span className="text-muted font-normal"> — {link.relation.toLowerCase()}</span>
                {link.isPrimaryGuardian && <span className="ml-2 inline-flex rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">PRIMARY</span>}
              </span>
              <button
                type="button"
                onClick={() => unlinkChild({ parentId, linkId: link.id })}
                className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                Unlink
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">No children linked yet.</p>
      )}

      {availableStudents.length > 0 ? (
        <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
          <div className="grid gap-1">
            <label htmlFor={`link-student-${parentId}`} className="text-xs font-semibold text-ink">
              Student
            </label>
            <select id={`link-student-${parentId}`} {...register("studentId")} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
              <option value="">— select —</option>
              {availableStudents.map((s) => (
                <option key={s.user.id} value={s.user.id}>
                  {s.user.firstName} {s.user.lastName} ({s.profile.admissionNo})
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1">
            <label htmlFor={`link-relation-${parentId}`} className="text-xs font-semibold text-ink">
              Relation
            </label>
            <select id={`link-relation-${parentId}`} {...register("relation")} className="rounded-xl border border-line bg-surface px-3 py-2 text-sm">
              <option value="FATHER">Father</option>
              <option value="MOTHER">Mother</option>
              <option value="GUARDIAN">Guardian</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-ink pb-2">
            <input type="checkbox" {...register("isPrimaryGuardian")} className="rounded border-line text-accent" />
            Primary
          </label>
          <button
            type="submit"
            disabled={linking}
            className="rounded-full bg-accent text-accent-ink text-xs font-semibold px-4 py-2 hover:bg-accent-strong disabled:opacity-60"
          >
            {linking ? "Linking…" : "Link"}
          </button>
          {errors.studentId && <p className="text-xs text-rose-600 w-full">{errors.studentId.message}</p>}
        </form>
      ) : (
        <p className="text-xs text-muted border-t border-line pt-3">Every student is already linked, or none exist yet.</p>
      )}
      {formError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{formError}</p>}
    </div>
  );
}

function CreateParentForm() {
  const [createParent, { isLoading }] = useCreateParentMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateParentInput>({ resolver: zodResolver(createParentSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const { data } = await createParent(values).unwrap();
      setCreated({ email: data.user.email, tempPassword: data.tempPassword });
      reset();
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
        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center text-sm">＋</div>
        <p className="text-xs font-mono uppercase tracking-widest font-bold text-muted">Add a parent</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="p-firstName" className="text-xs font-semibold text-ink">
            First name
          </label>
          <input id="p-firstName" {...register("firstName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          {errors.firstName && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.firstName.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="p-lastName" className="text-xs font-semibold text-ink">
            Last name
          </label>
          <input id="p-lastName" {...register("lastName")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
          {errors.lastName && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.lastName.message}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="p-email" className="text-xs font-semibold text-ink">
          Email
        </label>
        <input id="p-email" type="email" {...register("email")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
        {errors.email && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">{errors.email.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="p-phone" className="text-xs font-semibold text-ink">
          Phone <span className="text-muted font-normal">(optional)</span>
        </label>
        <input id="p-phone" {...register("phone")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
      </div>

      {formError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{formError}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="rounded-full bg-accent text-accent-ink text-sm font-semibold py-3 hover:bg-accent-strong disabled:opacity-60 shadow-sm"
      >
        {isLoading ? "Creating…" : "Add parent"}
      </button>
    </form>
  );
}

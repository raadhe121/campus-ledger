import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateSchoolWebsiteSchema, createAnnouncementSchema, type UpdateSchoolWebsiteInput, type CreateAnnouncementInput } from "@campus-ledger/validation-schemas";
import type { SchoolAnnouncement, SchoolWebsiteWithSchool, WebsiteStat, WebsiteHighlight, WebsiteCampus } from "@campus-ledger/shared-types";
import { Icon } from "../../components/Icon";
import { apiErrorMessage } from "../../lib/apiErrorMessage";
import { ListFieldEditor } from "./ListFieldEditor";
import {
  useGetMyWebsiteQuery,
  useUpdateMyWebsiteMutation,
  usePublishWebsiteMutation,
  useUnpublishWebsiteMutation,
  useListAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from "./websiteApi";

export function SchoolWebsitePage() {
  const { data, isLoading, error } = useGetMyWebsiteQuery();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Website</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Your public site</h1>
        <p className="text-sm text-muted mt-1">
          A normal, public website for your school — no sign-in required. It's served by its own separate deployment (<code className="font-mono text-xs">apps/school-site</code>), one per
          school, which reads whatever you publish here.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-2xl bg-surface-2 animate-pulse" />
      ) : error || !data ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your website settings.</p>
      ) : (
        <>
          <PublishCard website={data.data} />
          <ContentForm website={data.data} />
          <AnnouncementsPanel />
        </>
      )}
    </div>
  );
}

/** A stable-looking, deterministic local dev port per school (5300–5999) — so two schools run side by side without both defaulting to the same port and colliding. Purely a local-preview convenience; a real deployment picks its own port/host. */
function suggestedPort(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  return 5300 + (hash % 700);
}

function PublishCard({ website }: { website: { isPublished: boolean; school: { name: string; slug: string } } }) {
  const [publish, { isLoading: publishing }] = usePublishWebsiteMutation();
  const [unpublish, { isLoading: unpublishing }] = useUnpublishWebsiteMutation();
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const port = suggestedPort(website.school.slug);
  const command = `cd apps/school-site && VITE_SCHOOL_SLUG=${website.school.slug} PORT=${port} pnpm dev`;
  const previewUrl = `http://localhost:${port}/${website.school.slug}`;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 card-shadow space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${website.isPublished ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15" : "bg-surface-2 text-muted"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${website.isPublished ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            {website.isPublished ? "Published" : "Draft — not visible yet"}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <span>School slug:</span>
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-ink">{website.school.slug}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(website.school.slug);
                setCopiedSlug(true);
                setTimeout(() => setCopiedSlug(false), 1400);
              }}
              className="text-accent hover:underline font-medium"
            >
              {copiedSlug ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <button
          type="button"
          disabled={publishing || unpublishing}
          onClick={() => (website.isPublished ? unpublish() : publish())}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold disabled:opacity-60 transition-all ${
            website.isPublished ? "border border-line text-ink hover:bg-surface-2" : "bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/40"
          }`}
        >
          <Icon name={website.isPublished ? "visibility_off" : "public"} size={16} />
          {website.isPublished ? "Unpublish" : "Publish site"}
        </button>
      </div>

      {website.isPublished && (
        <div className="rounded-xl bg-paper border border-line p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Preview it locally <span className="font-normal normal-case text-muted/80">— there's no automatic hosted URL; a school's site is its own deployment (see the README)</span>
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-ink text-paper px-3 py-2 text-xs font-mono overflow-x-auto whitespace-nowrap">{command}</code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(command);
                setCopiedCommand(true);
                setTimeout(() => setCopiedCommand(false), 1400);
              }}
              className="shrink-0 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-2"
            >
              {copiedCommand ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Then open <code className="font-mono text-ink">{previewUrl}</code>.
          </p>
        </div>
      )}
    </div>
  );
}

type Row = Record<string, string>;

function ContentForm({ website }: { website: SchoolWebsiteWithSchool }) {
  const [updateWebsite, { isLoading }] = useUpdateMyWebsiteMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UpdateSchoolWebsiteInput>({ resolver: zodResolver(updateSchoolWebsiteSchema) });

  // The four repeatable lists are react-hook-form field arrays, not separate
  // state — `replace()` swaps the whole array in one go, which is exactly
  // what ListFieldEditor's onChange(nextItems) already hands back, and it
  // folds into the same reset() below instead of a second sync mechanism.
  const statsArray = useFieldArray({ control, name: "stats" });
  const highlightsArray = useFieldArray({ control, name: "highlights" });
  const programsArray = useFieldArray({ control, name: "programs" });
  const campusesArray = useFieldArray({ control, name: "campuses" });

  useEffect(() => {
    reset({
      tagline: website.tagline ?? "",
      aboutText: website.aboutText ?? "",
      admissionsText: website.admissionsText ?? "",
      contactEmail: website.contactEmail ?? "",
      contactPhone: website.contactPhone ?? "",
      address: website.address ?? "",
      heroImageUrl: website.heroImageUrl ?? "",
      philosophyText: website.philosophyText ?? "",
      philosophyImageUrl: website.philosophyImageUrl ?? "",
      themeColor: website.themeColor,
      stats: website.stats,
      highlights: website.highlights,
      programs: website.programs,
      campuses: website.campuses,
    });
  }, [website, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSaved(false);
    try {
      // Empty strings mean "clear the field" for these optional text columns — send null, not "".
      const body = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === "" ? null : v])) as UpdateSchoolWebsiteInput;
      // Drop rows the admin added but never filled in (every field still blank) rather than saving empty entries.
      const nonEmpty = <T extends Record<string, unknown>>(rows: T[]) => rows.filter((r) => Object.values(r).some((v) => typeof v === "string" && v.trim() !== ""));
      body.stats = nonEmpty(values.stats ?? []);
      body.highlights = nonEmpty(values.highlights ?? []);
      body.programs = nonEmpty(values.programs ?? []);
      body.campuses = nonEmpty(values.campuses ?? []);
      await updateWebsite(body).unwrap();
      setSaved(true);
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-surface p-6 card-shadow space-y-6">
      <div>
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Content</h2>
        <p className="text-xs text-muted mt-1">Every section below is optional — the public site only shows what you've filled in.</p>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="tagline" className="text-xs font-semibold text-ink">
          Tagline <span className="text-muted font-normal">— shown right under your school's name</span>
        </label>
        <input id="tagline" {...register("tagline")} placeholder="Excellence in education since 1998" className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
        {errors.tagline && <p className="text-xs text-rose-600">{errors.tagline.message}</p>}
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="heroImageUrl" className="text-xs font-semibold text-ink">
            Hero image URL <span className="text-muted font-normal">(optional)</span>
          </label>
          <input id="heroImageUrl" {...register("heroImageUrl")} placeholder="https://…" className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
          {errors.heroImageUrl && <p className="text-xs text-rose-600">{errors.heroImageUrl.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="themeColor" className="text-xs font-semibold text-ink">
            Theme color
          </label>
          <div className="flex items-center gap-2">
            <input type="color" {...register("themeColor")} className="h-10 w-12 rounded-lg border border-line bg-paper cursor-pointer" />
            <input {...register("themeColor")} className="flex-1 rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm font-mono" />
          </div>
          {errors.themeColor && <p className="text-xs text-rose-600">{errors.themeColor.message}</p>}
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="aboutText" className="text-xs font-semibold text-ink">
          About
        </label>
        <textarea id="aboutText" {...register("aboutText")} rows={4} className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="philosophyText" className="text-xs font-semibold text-ink">
            Philosophy / leadership message <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea id="philosophyText" {...register("philosophyText")} rows={4} className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="philosophyImageUrl" className="text-xs font-semibold text-ink">
            Its portrait/photo URL <span className="text-muted font-normal">(optional)</span>
          </label>
          <input id="philosophyImageUrl" {...register("philosophyImageUrl")} placeholder="https://…" className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
          {errors.philosophyImageUrl && <p className="text-xs text-rose-600">{errors.philosophyImageUrl.message}</p>}
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="admissionsText" className="text-xs font-semibold text-ink">
          Admissions
        </label>
        <textarea id="admissionsText" {...register("admissionsText")} rows={4} className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        <div className="grid gap-1.5">
          <label htmlFor="contactEmail" className="text-xs font-semibold text-ink">
            Contact email
          </label>
          <input id="contactEmail" type="email" {...register("contactEmail")} className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
          {errors.contactEmail && <p className="text-xs text-rose-600">{errors.contactEmail.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="contactPhone" className="text-xs font-semibold text-ink">
            Contact phone
          </label>
          <input id="contactPhone" {...register("contactPhone")} className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="address" className="text-xs font-semibold text-ink">
            Address
          </label>
          <input id="address" {...register("address")} className="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm" />
        </div>
      </div>

      <div className="pt-2 border-t border-line" />

      <ListFieldEditor
        title="Key numbers"
        hint='Short stat counters near the top of your homepage — e.g. "2,500+" / "Students".'
        items={statsArray.fields as unknown as Row[]}
        onChange={(next) => statsArray.replace(next as unknown as WebsiteStat[])}
        fields={[
          { key: "value", placeholder: "2,500+" },
          { key: "title", placeholder: "Students" },
        ]}
        addLabel="Add a stat"
      />

      <ListFieldEditor
        title="Achievements & highlights"
        hint="A grid of things you're proud of — academics, sports, scholarships, whatever's worth showing off."
        items={highlightsArray.fields as unknown as Row[]}
        onChange={(next) => highlightsArray.replace(next as unknown as WebsiteHighlight[])}
        fields={[
          { key: "title", placeholder: "Academic Excellence" },
          { key: "description", placeholder: "Optional short description", multiline: true },
        ]}
        addLabel="Add a highlight"
      />

      <ListFieldEditor
        title="Programs"
        hint="The stages/programs your school offers — e.g. Pre-Primary, Primary, Middle, Senior."
        items={programsArray.fields as unknown as Row[]}
        onChange={(next) => programsArray.replace(next as unknown as WebsiteHighlight[])}
        fields={[
          { key: "title", placeholder: "Primary Years" },
          { key: "description", placeholder: "Optional short description", multiline: true },
        ]}
        addLabel="Add a program"
      />

      <ListFieldEditor
        title="Campuses"
        hint="Only needed if your school has more than one location."
        items={campusesArray.fields as unknown as Row[]}
        onChange={(next) => campusesArray.replace(next as unknown as WebsiteCampus[])}
        fields={[
          { key: "name", placeholder: "Main Campus" },
          { key: "address", placeholder: "123 Main St, Springfield" },
        ]}
        addLabel="Add a campus"
      />

      {formError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">{formError}</p>}

      <div className="flex items-center gap-3 pt-2 border-t border-line">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold px-5 py-2.5 disabled:opacity-60 shadow-sm hover:shadow-md transition-all"
        >
          {isLoading ? "Saving…" : "Save changes"}
        </button>
        {saved && !formError && <p className="text-xs text-emerald-700">Saved.</p>}
      </div>
    </form>
  );
}

function AnnouncementsPanel() {
  const { data, isLoading } = useListAnnouncementsQuery();
  const [deleteAnnouncement] = useDeleteAnnouncementMutation();
  const [editing, setEditing] = useState<SchoolAnnouncement | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 card-shadow space-y-4">
      <div>
        <h2 className="text-sm font-bold text-ink uppercase tracking-wide">Announcements</h2>
        <p className="text-xs text-muted mt-0.5">News and notices shown on your public site, newest first.</p>
      </div>

      {isLoading ? (
        <div className="h-20 rounded-xl bg-surface-2 animate-pulse" />
      ) : data && data.data.length > 0 ? (
        <ul className="grid gap-2">
          {data.data.map((a) => (
            <li key={a.id} className="rounded-xl border border-line bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{a.title}</p>
                  <p className="text-xs text-muted mt-0.5">{new Date(a.publishedAt).toLocaleDateString()}</p>
                  <p className="text-sm text-ink mt-1.5 whitespace-pre-wrap">{a.body}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button type="button" onClick={() => setEditing(a)} className="text-xs font-semibold text-accent hover:underline">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      setRowError(null);
                      try {
                        await deleteAnnouncement(a.id).unwrap();
                      } catch (err) {
                        setRowError(apiErrorMessage(err));
                      }
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted py-4 text-center">No announcements yet.</p>
      )}
      {rowError && <p className="text-xs text-rose-600">{rowError}</p>}

      <AnnouncementForm editing={editing} onDone={() => setEditing(null)} />
    </section>
  );
}

function AnnouncementForm({ editing, onDone }: { editing: SchoolAnnouncement | null; onDone: () => void }) {
  const [createAnnouncement, { isLoading: creating }] = useCreateAnnouncementMutation();
  const [updateAnnouncement, { isLoading: updating }] = useUpdateAnnouncementMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAnnouncementInput>({ resolver: zodResolver(createAnnouncementSchema) });

  useEffect(() => {
    reset(editing ? { title: editing.title, body: editing.body } : { title: "", body: "" });
  }, [editing, reset]);

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (editing) {
        await updateAnnouncement({ announcementId: editing.id, body: values }).unwrap();
        onDone();
      } else {
        await createAnnouncement(values).unwrap();
        reset({ title: "", body: "" });
      }
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-xl bg-paper border border-line p-4 grid gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">{editing ? "Edit announcement" : "New announcement"}</p>
      <div className="grid gap-1.5">
        <label htmlFor="ann-title" className="text-xs font-medium text-ink">
          Title
        </label>
        <input id="ann-title" {...register("title")} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
        {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="ann-body" className="text-xs font-medium text-ink">
          Body
        </label>
        <textarea id="ann-body" {...register("body")} rows={3} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm" />
        {errors.body && <p className="text-xs text-rose-600">{errors.body.message}</p>}
      </div>
      {formError && <p className="text-xs text-rose-600">{formError}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={creating || updating}
          className="justify-self-start inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs font-semibold px-5 py-2.5 disabled:opacity-60 shadow-sm"
        >
          {creating || updating ? "Saving…" : editing ? "Save" : "Post announcement"}
        </button>
        {editing && (
          <button type="button" onClick={onDone} className="text-xs font-medium text-muted hover:underline">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

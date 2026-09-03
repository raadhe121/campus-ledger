import { Icon } from "../../components/Icon";
import { useListSubjectsQuery } from "./academicsApi";

// Read-only for Student/Teacher (architecture §07: Academic setup is "R"
// for both, distinct from School Admin's "Manage") — same /subjects
// endpoint the School Admin's SubjectsPage uses, just without the
// create/delete affordances neither role should see.
export function SubjectsReadOnlyPage({ roleLabel }: { roleLabel: string }) {
  const { data, isLoading, error } = useListSubjectsQuery();

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">{roleLabel}</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Subjects</h1>
        <p className="text-sm text-muted mt-1">Everything offered at your school this year.</p>
      </div>

      <div className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-12 w-full rounded-lg bg-surface-2 animate-pulse" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-rose-700">Could not load subjects.</p>
        ) : data && data.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {data.data.map((subject) => (
              <li key={subject.id} className="flex items-center gap-3 px-6 py-3.5">
                <div className="h-9 w-9 rounded-lg bg-accent-soft text-accent-strong flex items-center justify-center shrink-0">
                  <Icon name="auto_stories" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{subject.name}</p>
                  <p className="text-xs text-muted font-mono">{subject.code}</p>
                </div>
                {subject.isElective && (
                  <span className="inline-flex items-center rounded-full bg-surface-3 text-muted px-2.5 py-0.5 text-xs font-medium">Elective</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-sm text-muted">No subjects have been added yet.</p>
        )}
      </div>
    </div>
  );
}

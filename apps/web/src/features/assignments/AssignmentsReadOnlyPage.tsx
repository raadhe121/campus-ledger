import { useListAssignmentsQuery } from "./assignmentsApi";

// School Admin gets only "R" on Assignments (§07) — Teacher has "Manage
// (own)", so creation/editing lives entirely on the Teacher side.
export function AssignmentsReadOnlyPage() {
  const { data, isLoading, error } = useListAssignmentsQuery({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold">Academics</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">Assignments</h1>
        <p className="text-sm text-muted mt-1">Every assignment posted across the school — Teachers manage their own from their own area.</p>
      </div>

      <div className="rounded-2xl border border-line bg-surface overflow-hidden card-shadow">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <div className="h-4 w-24 rounded-full bg-surface-2 animate-pulse" />
            <div className="h-10 w-full rounded-xl bg-surface-2 animate-pulse" />
          </div>
        ) : error ? (
          <p className="p-8 text-center text-sm text-rose-700">Could not load assignments.</p>
        ) : data && data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2/60 text-left text-[11px] uppercase tracking-widest font-bold text-muted">
                  <th className="px-4 py-3.5">Title</th>
                  <th className="px-4 py-3.5">Subject</th>
                  <th className="px-4 py-3.5">Section</th>
                  <th className="px-4 py-3.5">Teacher</th>
                  <th className="px-4 py-3.5">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {data.data.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-2/40">
                    <td className="px-4 py-3.5 font-semibold text-ink">{a.title}</td>
                    <td className="px-4 py-3.5 text-muted">{a.subject.name}</td>
                    <td className="px-4 py-3.5 text-muted">
                      {a.section.className} · {a.section.name}
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {a.createdBy.firstName} {a.createdBy.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-muted font-mono text-xs">{new Date(a.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">📋</div>
            <p className="font-medium text-ink mt-3">No assignments posted yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

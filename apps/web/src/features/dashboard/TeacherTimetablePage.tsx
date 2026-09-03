import { WeeklyTimetable } from "../../components/WeeklyTimetable";
import { useGetMyTimetableQuery } from "../me/meApi";

export function TeacherTimetablePage() {
  const { data, isLoading, error } = useGetMyTimetableQuery();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Teacher</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">My Timetable</h1>
        <p className="text-sm text-muted mt-1">Every slot you're teaching, across every section.</p>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-xl bg-surface-2 animate-pulse" />
      ) : error || !data ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your timetable.</p>
      ) : (
        <WeeklyTimetable slots={data.data} subtitle={(slot) => `${slot.section.className} · ${slot.section.name}`} />
      )}
    </div>
  );
}

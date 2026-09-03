import { Icon } from "../../components/Icon";
import { WeeklyTimetable } from "../../components/WeeklyTimetable";
import { useGetMyTimetableQuery } from "../me/meApi";

export function StudentTimetablePage() {
  const { data, isLoading, error } = useGetMyTimetableQuery();

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Student</p>
        <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">My Timetable</h1>
        <p className="text-sm text-muted mt-1">Your weekly schedule for your current section.</p>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-xl bg-surface-2 animate-pulse" />
      ) : error || !data ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load your timetable.</p>
      ) : data.data.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">
            No timetable slots yet — either you haven't been enrolled into a section, or your School Admin hasn't scheduled it yet.
          </p>
        </div>
      ) : (
        <WeeklyTimetable slots={data.data} subtitle={(slot) => `${slot.teacher.firstName} ${slot.teacher.lastName}`} />
      )}
    </div>
  );
}

import { Icon } from "../../components/Icon";
import { ChildPicker } from "../../components/ChildPicker";
import { WeeklyTimetable } from "../../components/WeeklyTimetable";
import { useGetChildTimetableQuery } from "../me/meApi";
import { useSelectedChild } from "./useSelectedChild";

export function ParentTimetablePage() {
  const { children, studentId, selected, setStudentId, isLoading: childrenLoading } = useSelectedChild();
  const { data, isLoading, error } = useGetChildTimetableQuery(studentId, { skip: !studentId });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">Parent</p>
          <h1 className="text-3xl font-bold tracking-tight text-ink mt-1">Timetable</h1>
          {selected && (
            <p className="text-sm text-muted mt-1">
              {selected.student.firstName} {selected.student.lastName}'s weekly schedule.
            </p>
          )}
        </div>
        <ChildPicker options={children} studentId={studentId} onChange={setStudentId} />
      </div>

      {childrenLoading || isLoading ? (
        <div className="h-40 rounded-xl bg-surface-2 animate-pulse" />
      ) : children.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <span className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Icon name="hourglass_empty" size={20} />
          </span>
          <p className="text-sm text-amber-900">No children are linked to your account yet.</p>
        </div>
      ) : error || !data ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">Could not load the timetable.</p>
      ) : (
        <WeeklyTimetable slots={data.data} subtitle={(slot) => `${slot.teacher.firstName} ${slot.teacher.lastName}`} />
      )}
    </div>
  );
}

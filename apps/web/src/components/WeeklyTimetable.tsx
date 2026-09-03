import type { TimetableSlotWithDetails } from "@campus-ledger/shared-types";
import { Icon } from "./Icon";

// Monday-first display order — Date#getDay()'s 0=Sunday stays the stored
// value (matches JS everywhere else in the app), this just controls how a
// week reads on screen.
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_LABELS: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

function formatTime(value: string): string {
  const [h, m] = value.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

/** A read-only weekly schedule — shared by Teacher's and Student's own timetable views (architecture §07's "R (own)"/"R (self)" scope). `subtitle` renders the bit that differs per role: who's teaching it (for a student) or which class it's for (for a teacher). */
export function WeeklyTimetable({ slots, subtitle }: { slots: TimetableSlotWithDetails[]; subtitle: (slot: TimetableSlotWithDetails) => string }) {
  const byDay = new Map<number, TimetableSlotWithDetails[]>();
  for (const slot of slots) {
    const list = byDay.get(slot.dayOfWeek) ?? [];
    list.push(slot);
    byDay.set(slot.dayOfWeek, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const activeDays = DAY_ORDER.filter((d) => byDay.has(d));

  if (activeDays.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-8 text-center card-shadow">
        <div className="mx-auto h-12 w-12 rounded-xl bg-surface-2 flex items-center justify-center text-muted mb-3">
          <Icon name="calendar_month" size={26} />
        </div>
        <p className="text-sm text-muted">No timetable slots yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeDays.map((day) => (
        <section key={day} className="bg-surface border border-line rounded-xl card-shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-line bg-surface-2">
            <h3 className="text-sm font-bold text-ink">{DAY_LABELS[day]}</h3>
          </div>
          <ul className="divide-y divide-line">
            {byDay.get(day)!.map((slot) => (
              <li key={slot.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">{slot.subject.name}</p>
                  <span className="text-xs font-mono text-muted whitespace-nowrap">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">{subtitle(slot)}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

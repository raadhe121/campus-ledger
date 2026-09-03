export interface RankedItem {
  label: string;
  value: number;
}

/**
 * A horizontal ranked-bar list — top schools by enrollment, expenses by
 * category, enrollment by class. Every bar carries its own direct label
 * (the category name, right there beside it), so — per the dataviz
 * skill's "text never wears the data color" + direct-labeling guidance —
 * identity never depends on distinguishing hues at all: every bar can
 * share one consistent color without losing legibility, sidestepping the
 * categorical-palette question entirely for open-ended, user-authored
 * category names (expense categories aren't a fixed enum).
 */
export function RankedBarList({ data, color, formatValue = (v) => v.toLocaleString(), emptyLabel = "Nothing here yet." }: { data: RankedItem[]; color: string; formatValue?: (v: number) => string; emptyLabel?: string }) {
  if (data.length === 0) return <p className="text-sm text-muted py-6 text-center">{emptyLabel}</p>;

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-ink truncate mb-1">{d.label}</p>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full rounded-full transition-[width]" style={{ width: `${(d.value / max) * 100}%`, backgroundColor: color }} />
            </div>
          </div>
          <p className="text-xs font-semibold text-ink tabular-nums shrink-0">{formatValue(d.value)}</p>
        </div>
      ))}
    </div>
  );
}

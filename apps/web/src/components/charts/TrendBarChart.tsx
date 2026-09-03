export interface TrendPoint {
  label: string;
  value: number;
}

/**
 * A single-series magnitude-over-time bar chart — schools created per
 * month, fees collected per month, etc. One consistent hue (the page's own
 * accent), so no legend: a single series names itself via the chart title
 * (dataviz skill's "1-3 series, direct-label" + "single series needs no
 * legend box" rules). Bars are capped at 24px, 4px rounded data-ends
 * square at the baseline, with a hairline zero-baseline and a per-bar
 * hover tooltip built from pure CSS (`group`/`group-hover`) rather than
 * JS state — no mouse-tracking needed for evenly-spaced bars.
 */
export function TrendBarChart({ data, color, formatValue = (v) => v.toLocaleString() }: { data: TrendPoint[]; color: string; formatValue?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="w-full">
      <div className="flex items-end gap-2 h-36">
        {data.map((d) => {
          const heightPct = (d.value / max) * 100;
          return (
            <div key={d.label} className="group relative flex-1 h-full flex items-end justify-center">
              <div
                className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink text-paper text-[11px] font-semibold px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none tabular-nums z-10"
                role="tooltip"
              >
                {formatValue(d.value)}
              </div>
              <div
                className="w-full max-w-6 rounded-t-[4px] transition-[filter] group-hover:brightness-110"
                style={{ height: `${Math.max(heightPct, d.value > 0 ? 3 : 0)}%`, backgroundColor: color, minHeight: d.value > 0 ? 3 : 0 }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-2 border-t border-line pt-1.5">
        {data.map((d) => (
          <p key={d.label} className="flex-1 text-center text-[11px] font-medium text-muted truncate">
            {d.label}
          </p>
        ))}
      </div>
    </div>
  );
}

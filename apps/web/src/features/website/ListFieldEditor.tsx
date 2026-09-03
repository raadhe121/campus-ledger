import { Icon } from "../../components/Icon";

export interface ListFieldConfig {
  key: string;
  placeholder: string;
  multiline?: boolean;
}

/**
 * A generic add/remove row editor for the small, together-edited lists a
 * school's site carries — stats, achievements, programs, campuses. One
 * implementation instead of four near-identical ones; each caller just
 * supplies which fields a row has (see SchoolWebsitePage.tsx). Rows are
 * plain `Record<string, string>` here — callers cast to their own typed
 * shape (WebsiteStat, WebsiteHighlight, WebsiteCampus) only at the form's
 * submit boundary, since react-hook-form doesn't own this state.
 */
export function ListFieldEditor({
  title,
  hint,
  items,
  onChange,
  fields,
  addLabel = "Add",
  max = 12,
}: {
  title: string;
  hint?: string;
  items: Record<string, string>[];
  onChange: (items: Record<string, string>[]) => void;
  fields: ListFieldConfig[];
  addLabel?: string;
  max?: number;
}) {
  return (
    <div className="grid gap-2.5">
      <div>
        <p className="text-xs font-semibold text-ink">{title}</p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>

      {items.length > 0 && (
        <div className="grid gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`flex-1 grid gap-2 ${fields.length > 1 ? "sm:grid-cols-2" : ""}`}>
                {fields.map((f) =>
                  f.multiline ? (
                    <textarea
                      key={f.key}
                      value={item[f.key] ?? ""}
                      onChange={(e) => {
                        const next = items.slice();
                        next[i] = { ...next[i], [f.key]: e.target.value };
                        onChange(next);
                      }}
                      placeholder={f.placeholder}
                      rows={2}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm sm:col-span-2"
                    />
                  ) : (
                    <input
                      key={f.key}
                      value={item[f.key] ?? ""}
                      onChange={(e) => {
                        const next = items.slice();
                        next[i] = { ...next[i], [f.key]: e.target.value };
                        onChange(next);
                      }}
                      placeholder={f.placeholder}
                      className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                    />
                  ),
                )}
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Remove"
                className="shrink-0 h-9 w-9 rounded-lg border border-line text-muted hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-colors"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {items.length < max && (
        <button
          type="button"
          onClick={() => onChange([...items, Object.fromEntries(fields.map((f) => [f.key, ""]))])}
          className="justify-self-start inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
        >
          <Icon name="add" size={14} />
          {addLabel}
        </button>
      )}
    </div>
  );
}

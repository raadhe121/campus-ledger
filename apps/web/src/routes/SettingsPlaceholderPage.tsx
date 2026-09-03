export function SettingsPlaceholderPage() {
  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border border-line bg-surface p-8 card-shadow relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br from-violet-500/10 to-indigo-500/10 blur-2xl" />
        <div className="h-12 w-12 rounded-2xl bg-surface-2 border border-line flex items-center justify-center text-xl">⚙️</div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] font-bold text-gold mt-4">Phase · Upcoming</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">System settings</h1>
        <p className="text-sm leading-6 text-muted mt-2">This area is on the blueprint (§11) — platform preferences, feature flags and maintenance controls will live here.</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs font-bold">Not built yet</span>
          <span className="rounded-full bg-surface-2 border border-line px-3 py-1 text-xs font-mono text-muted">§11 · Settings</span>
        </div>
      </div>
    </div>
  );
}

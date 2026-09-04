/** What a bare "/" shows when this deployment has no VITE_SCHOOL_SLUG default configured — not an error, just a nudge, since a single deployment now serves any school at /<slug> with no rebuild needed. */
export function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-navy text-white">
      <div className="max-w-md text-center space-y-3">
        <p className="font-display text-2xl font-semibold">Campus Ledger school sites</p>
        <p className="text-white/70 text-sm leading-relaxed">This page hosts public school websites at their own address — visit a specific school's link, e.g. <code className="bg-white/10 rounded px-1.5 py-0.5">/your-school-slug</code>, to view it.</p>
      </div>
    </div>
  );
}

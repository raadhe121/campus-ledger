import { Link, Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-paper/75 border-b border-line">
        <div className="mx-auto max-w-5xl px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-accent text-accent-ink flex items-center justify-center font-bold text-[13px] shadow-sm group-hover:bg-accent-strong transition-colors">
              CL
            </div>
            <span className="font-semibold tracking-tight text-ink">Campus Ledger</span>
            <span className="hidden sm:inline-flex rounded-full bg-gold/15 text-gold border border-gold/20 px-2 py-0.5 text-[10px] font-bold tracking-widest">
              CAMPUS
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/designs" className="rounded-full bg-ink text-white text-xs font-semibold px-3.5 py-2 hover:bg-black transition-colors">
              ✨ Designs
            </Link>
            <Link to="/status" className="hidden sm:inline-flex rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink hover:bg-surface-2">
              Status
            </Link>
            <Link to="/login" className="rounded-full bg-accent text-accent-ink px-4 py-2 text-xs font-semibold hover:bg-accent-strong transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-line bg-surface/60 backdrop-blur">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span className="font-mono">© 2026 Campus Ledger</span>
          <span className="flex items-center gap-3">
            <Link to="/designs" className="hover:text-ink">Designs</Link>
            <span className="opacity-30">·</span>
            <Link to="/status" className="hover:text-ink">Health</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}

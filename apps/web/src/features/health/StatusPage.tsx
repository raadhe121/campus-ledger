import { useGetDbHealthQuery, useGetHealthQuery } from "./healthApi";
import { CheckCard } from "./CheckCard";

export function StatusPage() {
  const api = useGetHealthQuery();
  const db = useGetDbHealthQuery();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-2xl border border-line bg-surface p-7 card-shadow relative overflow-hidden mb-8">
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-500/15 to-teal-500/10 blur-2xl" />
        <p className="relative text-[11px] font-mono uppercase tracking-[0.18em] font-bold text-gold">Phase 00 · Scaffold</p>
        <h1 className="relative text-3xl font-semibold tracking-tight text-ink mt-1">Frontend ⇄ backend ⇄ database</h1>
        <p className="relative text-sm leading-6 text-muted max-w-prose mt-2">
          Two independent RTK Query checks: <code className="font-mono text-xs bg-surface-2 border border-line px-1.5 py-0.5 rounded">GET /health</code> proves the API is up,
          <code className="font-mono text-xs bg-surface-2 border border-line px-1.5 py-0.5 rounded ml-1">GET /health/db</code> proves it reaches Postgres — with Doppler badge.
        </p>
        <div className="relative mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 text-xs font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live checks
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-2 border border-line px-3 py-1 text-xs font-mono text-muted">
            RTK Query · auto-refetch
          </span>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 max-w-3xl">
        <CheckCard
          label="API"
          isLoading={api.isLoading || api.isFetching}
          isError={!!api.error}
          errorHint={<>Is <code className="font-mono">pnpm dev:api</code> running on port 4000?</>}
          onRetry={() => api.refetch()}
        >
          <p className="flex items-center gap-2 text-emerald-700 font-semibold mb-3 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> {api.data?.data.status.toUpperCase()}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm bg-surface-2/50 rounded-xl p-3 border border-line/50">
            <dt className="text-[11px] font-mono uppercase tracking-wide font-bold text-muted">Service</dt>
            <dd className="font-mono text-xs font-medium">{api.data?.data.service}</dd>
            <dt className="text-[11px] font-mono uppercase tracking-wide font-bold text-muted">Checked</dt>
            <dd className="font-mono text-xs">{api.data ? new Date(api.data.data.timestamp).toLocaleTimeString() : "—"}</dd>
          </dl>
        </CheckCard>

        <CheckCard
          label="Database"
          isLoading={db.isLoading || db.isFetching}
          isError={!!db.error}
          errorHint={
            (db.error && "data" in db.error
              ? (db.error.data as { error?: { message?: string } })?.error?.message
              : undefined) ?? "DATABASE_URL didn't resolve to a live Postgres — check Doppler or apps/api/.env."
          }
          onRetry={() => db.refetch()}
        >
          <p className="flex items-center gap-2 text-emerald-700 font-semibold mb-3 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> {db.data?.data.status.toUpperCase()}
          </p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm bg-surface-2/50 rounded-xl p-3 border border-line/50">
            <dt className="text-[11px] font-mono uppercase tracking-wide font-bold text-muted">Target</dt>
            <dd className="font-mono text-xs font-medium break-all">{db.data?.data.target}</dd>
            <dt className="text-[11px] font-mono uppercase tracking-wide font-bold text-muted">Latency</dt>
            <dd className="font-mono text-xs">{db.data?.data.latencyMs} ms</dd>
            <dt className="text-[11px] font-mono uppercase tracking-wide font-bold text-muted">Source</dt>
            <dd className="font-mono text-xs">
              {db.data?.data.doppler ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
                  doppler · {db.data.data.doppler.project}/{db.data.data.doppler.config}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[11px] font-bold">.env</span>
              )}
            </dd>
          </dl>
        </CheckCard>
      </div>
    </div>
  );
}

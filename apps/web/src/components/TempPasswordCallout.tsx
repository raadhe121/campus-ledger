import { useState } from "react";

export function TempPasswordCallout({
  email,
  tempPassword,
  onDismiss,
  dismissLabel = "Add another",
}: {
  email: string;
  tempPassword: string;
  onDismiss: () => void;
  dismissLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-5 card-shadow animate-fadeIn">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm shrink-0">✓</div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">Account created</p>
          <p className="text-xs text-emerald-700/70 mt-0.5">Share these credentials securely — shown only once.</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-emerald-200/60 p-3 grid gap-2 mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted font-semibold">Email</span>
          <span className="text-sm font-mono text-ink break-all">{email}</span>
        </div>
        <div className="h-px bg-emerald-100" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted font-semibold">Temp password</span>
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono font-bold text-ink bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              {tempPassword}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
              className="rounded-full bg-ink text-white text-xs font-semibold px-3 py-1 hover:bg-black transition-colors"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <button type="button" onClick={onDismiss} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold px-4 py-2 hover:bg-emerald-700 transition-colors">
        {dismissLabel} →
      </button>
    </div>
  );
}

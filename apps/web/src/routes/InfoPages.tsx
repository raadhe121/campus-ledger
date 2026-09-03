import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../app/store";
import { useLogoutMutation } from "../features/auth/authApi";
import { loggedOut } from "../features/auth/authSlice";

function CenteredMessage({ eyebrow, title, description, icon }: { eyebrow: string; title: string; description: string; icon: string }) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [logout] = useLogoutMutation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-surface border border-line flex items-center justify-center text-2xl card-shadow mb-4">{icon}</div>
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] font-bold text-gold">{eyebrow}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink mt-1">{title}</h1>
        <p className="text-sm leading-6 text-muted mt-2">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link to="/designs" className="rounded-full bg-ink text-white px-4 py-2 text-xs font-semibold hover:bg-black transition-colors">
            ✨ Browse designs
          </Link>
          <Link to="/status" className="rounded-full border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-2">
            Health
          </Link>
          {user && (
            <button
              type="button"
              onClick={() => logout().finally(() => dispatch(loggedOut()))}
              className="rounded-full bg-accent text-accent-ink px-4 py-2 text-xs font-semibold hover:bg-accent-strong"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <CenteredMessage
      eyebrow="403 · Forbidden"
      title="Not available for your role"
      icon="🚫"
      description="Your account doesn't have access to this area. Check your role or contact an admin."
    />
  );
}

export function ComingSoonPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  return (
    <CenteredMessage
      eyebrow={user?.role.replace("_", " ") ?? "Coming soon"}
      title="This dashboard isn't built yet"
      icon="🚧"
      description="Super Admin and School Admin are live. Other roles (Teacher, Parent…) are on the blueprint's roadmap — stay tuned."
    />
  );
}

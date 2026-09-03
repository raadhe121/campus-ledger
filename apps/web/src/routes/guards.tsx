import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "@campus-ledger/shared-types";
import type { RootState } from "../app/store";
import { AssistantWidget } from "../features/assistant/AssistantWidget";

/** Waits on AuthBootstrap's silent refresh before deciding anything — avoids a login-page flash on reload. */
export function RequireAuth() {
  const { user, bootstrapped } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (!bootstrapped) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Rendered alongside the Outlet, not inside any one role's AppShell —
  // every authenticated screen gets the widget, including roles (STAFF)
  // that have no dashboard/layout of their own yet.
  return (
    <>
      <Outlet />
      <AssistantWidget />
    </>
  );
}

/** Nest inside RequireAuth — a signed-in user with the wrong role sees Forbidden, not a redirect loop. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user) return null; // RequireAuth above already handles the unauthenticated case
  if (!roles.includes(user.role)) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}

function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center text-muted text-sm">
      Loading…
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../app/store";
import { credentialsReceived, loggedOut } from "./authSlice";
import { useRefreshMutation } from "./authApi";

/**
 * Runs once, before anything else renders a route. Spends the refresh
 * cookie (if the browser still has one) to silently restore a session,
 * so reloading the page doesn't drop a signed-in user back to /login.
 * Route guards (routes/guards.tsx) wait on `auth.bootstrapped` rather
 * than racing this.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const [refresh] = useRefreshMutation();
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    refresh()
      .unwrap()
      .then(({ data }) => dispatch(credentialsReceived(data)))
      .catch(() => dispatch(loggedOut()));
  }, [dispatch, refresh]);

  return <>{children}</>;
}

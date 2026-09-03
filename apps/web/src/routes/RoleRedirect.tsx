import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../app/store";

/** Sends a signed-in user to their role's home. SUPER_ADMIN, SCHOOL_ADMIN, STUDENT, TEACHER, PARENT and ACCOUNTANT have one built so far — see architecture §11. */
export function RoleRedirect() {
  const user = useSelector((state: RootState) => state.auth.user);

  if (user?.role === "SUPER_ADMIN") return <Navigate to="/super-admin" replace />;
  if (user?.role === "SCHOOL_ADMIN") return <Navigate to="/school-admin" replace />;
  if (user?.role === "STUDENT") return <Navigate to="/student" replace />;
  if (user?.role === "TEACHER") return <Navigate to="/teacher" replace />;
  if (user?.role === "PARENT") return <Navigate to="/parent" replace />;
  if (user?.role === "ACCOUNTANT") return <Navigate to="/accountant" replace />;

  return <Navigate to="/coming-soon" replace />;
}

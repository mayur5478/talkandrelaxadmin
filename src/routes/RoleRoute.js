// RoleRoute.js
//
// Blocks direct URL access to pages the active role should not see, so the
// sidebar/command-palette filtering can't be sidestepped by typing a path.
//
// ⚠️  UI-level only. The backend still accepts these calls from any admins-table
// account — see src/utils/roles.js and middlewares/auth/secure.js.
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, isHR } from "../utils/roles";

export default function RoleRoute() {
  const { pathname } = useLocation();

  if (!canAccessPath(pathname)) {
    // Send HR somewhere they can actually use rather than a dead end.
    const fallback = isHR()
      ? "/dashboard/listener-management/listeners-list"
      : "/dashboard/analytics";
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

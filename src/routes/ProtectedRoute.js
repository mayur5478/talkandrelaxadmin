// ProtectedRoute.js
import { Navigate, Outlet } from "react-router-dom";
import { isTokenExpired } from "../utils/checkToken";

import { getCookie } from "../cookie_helper/cookie";

export default function ProtectedRoute() {
  const token = getCookie("token") || localStorage.getItem("token");

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem("token");
    return <Navigate to="/" replace />;
  }

  return <Outlet />; // ✅ renders nested protected routes
}

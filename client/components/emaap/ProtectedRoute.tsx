import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const token = localStorage.getItem("emaap_auth_token");
  const role = localStorage.getItem("emaap_role");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

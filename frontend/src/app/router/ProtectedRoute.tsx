import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "@hrms/shared-types";
import { useAppSelector } from "@/app/store/hooks";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const fallbackPath = user?.role === "hr" ? "/hr" : user?.role === "stakeholder" ? "/stakeholder" : "/dashboard";

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (user.must_change_password && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}

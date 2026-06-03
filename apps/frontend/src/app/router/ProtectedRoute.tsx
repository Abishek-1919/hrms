import { Navigate, Outlet, useLocation } from "react-router-dom";
import type { Role } from "@hrms/shared-types";
import { useAppSelector } from "@/app/store/hooks";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, accessToken } = useAppSelector((state) => state.auth);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

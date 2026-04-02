import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../hooks/reduxHooks";
import type { RootState } from "../../redux/store";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const normalizeRoleName = (role: unknown): string | null => {
  if (typeof role === "string") return role.toLowerCase();
  if (
    role &&
    typeof role === "object" &&
    "name" in role &&
    typeof (role as { name?: unknown }).name === "string"
  ) {
    return (role as { name: string }).name.toLowerCase();
  }
  return null;
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAppSelector(
    (state: RootState) => state.auth,
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = ((user?.roles ?? []) as unknown[])
      .map(normalizeRoleName)
      .filter((role): role is string => Boolean(role));
    const hasRole = allowedRoles.some((r) =>
      userRoles.includes(r.toLowerCase()),
    );
    if (!hasRole) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

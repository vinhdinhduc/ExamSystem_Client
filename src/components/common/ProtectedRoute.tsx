import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../hooks/reduxHooks";
import type { RootState } from "../../redux/store";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

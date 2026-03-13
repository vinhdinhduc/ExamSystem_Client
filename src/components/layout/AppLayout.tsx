import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { logout } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <header className="topbar">
        <h1>Online Exam System</h1>
        <div className="topbar-right">
          <span>{user?.fullName ?? user?.username ?? "User"}</span>
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="content-grid">
        <aside className="sidebar">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/exams">Exams</NavLink>
        </aside>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

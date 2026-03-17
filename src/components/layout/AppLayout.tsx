import { useMemo, useState } from "react";
import {
  IoAlbumsOutline,
  IoBookOutline,
  IoGridOutline,
  IoLogOutOutline,
  IoMenuOutline,
  IoPeopleOutline,
  IoSchoolOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { logoutAsync } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.roles?.some((r) => r.toLowerCase() === "admin") ?? false;

  const navigationItems = useMemo(
    () => [
      { to: "/dashboard", label: "Dashboard", icon: <IoGridOutline /> },
      { to: "/subjects", label: "Môn học", icon: <IoBookOutline /> },
      { to: "/exams", label: "Đề thi", icon: <IoAlbumsOutline /> },
      { to: "/exams/new", label: "Tạo đề", icon: <IoSchoolOutline /> },
      { to: "/groups", label: "Nhóm / lớp", icon: <IoPeopleOutline /> },
      ...(isAdmin
        ? [{ to: "/admin/roles", label: "Roles & Permissions", icon: <IoShieldCheckmarkOutline /> }]
        : []),
    ],
    [isAdmin],
  );

  const handleLogout = async () => {
    await dispatch(logoutAsync());
    toast.success("Đăng xuất thành công");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <aside
        className={`app-sidebar ${sidebarOpen ? "app-sidebar--open" : ""}`.trim()}
      >
        <div className="app-sidebar__brand">
          <div className="app-sidebar__brand-mark">E</div>
          <div>
            <strong className="app-sidebar__brand-title">Exam Studio</strong>
            <p className="app-sidebar__brand-subtitle">
              Online Testing Platform
            </p>
          </div>
        </div>

        <nav className="app-sidebar__nav">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-sidebar__link ${isActive ? "app-sidebar__link--active" : ""}`.trim()
              }
              onClick={() => setSidebarOpen(false)}
            >
              <span className="app-sidebar__link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <div className="app-sidebar__user">
            <div className="app-sidebar__avatar">
              {(user?.fullName ?? user?.username ?? "U").charAt(0)}
            </div>
            <div>
              <strong>{user?.fullName ?? user?.username ?? "User"}</strong>
              <p>{user?.roles?.join(", ") ?? "student"}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            iconLeft={<IoLogOutOutline />}
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </aside>

      <div className="app-layout__main">
        <header className="app-navbar">
          <div>
            <button
              type="button"
              className="app-navbar__menu"
              onClick={() => setSidebarOpen((current) => !current)}
            >
              <IoMenuOutline />
            </button>
            <div className="app-navbar__intro">
              <p className="app-navbar__eyebrow">Hệ thống thi trắc nghiệm</p>
              <h1 className="app-navbar__title">
                Quản trị đề thi và ca thi trực tuyến
              </h1>
            </div>
          </div>

          <div className="app-navbar__profile">
            <div className="app-navbar__chip">
              <span className="app-navbar__chip-label">Vai trò</span>
              <strong>{user?.roles?.[0] ?? "student"}</strong>
            </div>
          </div>
        </header>

        <main className="page-shell">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

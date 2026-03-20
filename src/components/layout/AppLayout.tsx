import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  IoAlbumsOutline,
  IoBarChartOutline,
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
import { getAvatarUrl } from "../../api/services/userService";
import { FaX } from "react-icons/fa6";

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

const AppLayout = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarPopup, setAvatarPopup] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const avatarBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const normalizedRoles = useMemo(
    () =>
      ((user?.roles ?? []) as unknown[])
        .map(normalizeRoleName)
        .filter((role): role is string => Boolean(role)),
    [user?.roles],
  );

  const isAdmin = normalizedRoles.includes("admin");
  const isTeacher = normalizedRoles.includes("teacher");
  const isStudent = normalizedRoles.includes("student");

  const navigationItems = useMemo(() => {
    const items: { to: string; label: string; icon: ReactNode }[] = [
      { to: "/dashboard", label: "Bảng điều khiển", icon: <IoGridOutline /> },
    ];

    // Students see dashboard, assigned exams, profile
    if (isStudent) {
      items.push({
        to: "/exams",
        label: "Đề thi của tôi",
        icon: <IoAlbumsOutline />,
      });
      items.push({
        to: "/results",
        label: "Kết quả đã làm",
        icon: <IoBarChartOutline />,
      });
    }

    // Teachers see exam management features
    if (isTeacher) {
      items.push(
        { to: "/subjects", label: "Môn học", icon: <IoBookOutline /> },
        { to: "/exams", label: "Đề thi", icon: <IoAlbumsOutline /> },
        {
          to: "/exams/new",
          label: "Tạo đề thi",
          icon: <IoSchoolOutline />,
        },
        {
          to: "/results",
          label: "Kết quả học sinh",
          icon: <IoBarChartOutline />,
        },
        { to: "/groups", label: "Nhóm / lớp", icon: <IoPeopleOutline /> },
      );
    }

    // Admins see all features
    if (isAdmin) {
      items.push(
        { to: "/subjects", label: "Môn học", icon: <IoBookOutline /> },
        { to: "/exams", label: "Đề thi", icon: <IoAlbumsOutline /> },
        {
          to: "/exams/new",
          label: "Tạo đề thi",
          icon: <IoSchoolOutline />,
        },
        {
          to: "/results",
          label: "Kết quả học sinh",
          icon: <IoBarChartOutline />,
        },
        { to: "/groups", label: "Nhóm / lớp", icon: <IoPeopleOutline /> },
        {
          to: "/admin/users",
          label: "Quản lý người dùng",
          icon: <IoPeopleOutline />,
        },
        {
          to: "/admin/roles",
          label: "Vai trò & Quyền hạn",
          icon: <IoShieldCheckmarkOutline />,
        },
      );
    }

    return items;
  }, [isAdmin, isTeacher, isStudent]);

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
          <div className="app-sidebar__brand-mark">
            <img
              src="/logo_exam.png"
              alt="Logo"
              className="app-sidebar__brand-logo"
            />
          </div>
          <div>
            <strong className="app-sidebar__brand-title">Hệ thống thi</strong>
            <p className="app-sidebar__brand-subtitle">
              Nền tảng thi trực tuyến
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
          <div
            className="app-sidebar__user app-sidebar__user--clickable"
            onClick={() => {
              navigate("/profile");
              setSidebarOpen(false);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                navigate("/profile");
                setSidebarOpen(false);
              }
            }}
          >
            {getAvatarUrl(user?.avatar) ? (
              <img
                src={getAvatarUrl(user?.avatar)!}
                alt="avatar"
                className="app-sidebar__avatar app-sidebar__avatar--img"
              />
            ) : (
              <div className="app-sidebar__avatar">
                {(user?.fullName ?? user?.username ?? "U").charAt(0)}
              </div>
            )}
            <div>
              <strong>
                {user?.fullName ?? user?.username ?? "Người dùng"}
              </strong>
              <p>
                {(normalizedRoles[0] === "admin" && "Quản trị viên") ||
                  (normalizedRoles[0] === "teacher" && "Giáo viên") ||
                  "Học sinh"}
              </p>
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
                {isAdmin
                  ? "Chào mừng Quản trị viên"
                  : isTeacher
                    ? "Chào mừng Giáo viên"
                    : "Chào mừng Học sinh"}
              </h1>
            </div>
          </div>

          <div className="app-navbar__profile">
            <div className="app-navbar__chip">
              <span className="app-navbar__chip-label">Vai trò</span>
              <strong>
                {(normalizedRoles[0] === "admin" && "Quản trị viên") ||
                  (normalizedRoles[0] === "teacher" && "Giáo viên") ||
                  "Học sinh"}
              </strong>
            </div>
            <div className="app-navbar__avatar-wrap">
              <button
                ref={avatarBtnRef}
                type="button"
                className="app-navbar__avatar-btn"
                onClick={() => setAvatarPopup((v) => !v)}
                title="Trang cá nhân"
              >
                {getAvatarUrl(user?.avatar) ? (
                  <img
                    src={getAvatarUrl(user?.avatar)!}
                    alt="avatar"
                    className="app-navbar__avatar-img"
                  />
                ) : (
                  <div className="app-navbar__avatar">
                    {(user?.fullName ?? user?.username ?? "U").charAt(0)}
                  </div>
                )}
              </button>

              {avatarPopup && (
                <>
                  <div
                    className="app-navbar__avatar-overlay"
                    onClick={() => setAvatarPopup(false)}
                  />
                  <div className="app-navbar__avatar-popup">
                    {getAvatarUrl(user?.avatar) ? (
                      <img
                        src={getAvatarUrl(user?.avatar)!}
                        alt="avatar"
                        className="app-navbar__avatar-popup-img"
                        onClick={() => setLightbox(true)}
                        title="Phóng to"
                      />
                    ) : (
                      <div className="app-navbar__avatar-popup-fallback">
                        {(user?.fullName ?? user?.username ?? "U").charAt(0)}
                      </div>
                    )}
                    <strong className="app-navbar__avatar-popup-name">
                      {user?.fullName ?? user?.username ?? "Người dùng"}
                    </strong>
                    <p className="app-navbar__avatar-popup-role">
                      {(normalizedRoles[0] === "admin" && "Quản trị viên") ||
                        (normalizedRoles[0] === "teacher" && "Giáo viên") ||
                        "Học sinh"}
                    </p>
                    <button
                      type="button"
                      className="app-navbar__avatar-popup-btn"
                      onClick={() => {
                        setAvatarPopup(false);
                        navigate("/profile");
                      }}
                    >
                      Xem hồ sơ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="page-shell">
          <Outlet />
        </main>
      </div>

      {lightbox && getAvatarUrl(user?.avatar) && (
        <div className="avatar-lightbox" onClick={() => setLightbox(false)}>
          <img
            src={getAvatarUrl(user?.avatar)!}
            alt="avatar"
            className="avatar-lightbox__img"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="avatar-lightbox__close"
            onClick={() => setLightbox(false)}
          >
            <FaX />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppLayout;

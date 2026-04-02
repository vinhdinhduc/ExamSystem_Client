import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { login } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAppSelector((state: RootState) => state.auth);

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(login({ usernameOrEmail, password }));
    if (login.fulfilled.match(result)) {
      toast.success("Đăng nhập thành công");
      navigate("/dashboard", { replace: true });
      return;
    }
    if (result.payload === "Email chưa được xác thực. Vui lòng kiểm tra hộp thư và click vào link xác thực.") {
      toast.warning(result.payload, { autoClose: 6000 });
    } else {
      toast.error(result.payload ?? "Tên đăng nhập hoặc mật khẩu không đúng");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Đăng nhập</h2>
        <p>Chào mừng bạn trở lại hệ thống thi trắc nghiệm</p>

        <label htmlFor="usernameOrEmail">Tên đăng nhập hoặc Email</label>
        <input
          id="usernameOrEmail"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          placeholder="Nhập email"
          autoComplete="username"
          required
        />

        <label htmlFor="password">Mật khẩu</label>
        <div className="input-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            required
          />
          <button type="button" className="eye-btn" onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
            <EyeIcon open={showPassword} />
          </button>
        </div>

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        <Link to="/forgot-password" className="muted-link">Quên mật khẩu?</Link>

        <div className="auth-divider">hoặc</div>

        <Link to="/register" className="muted-link">Chưa có tài khoản? Đăng ký ngay</Link>
      </form>
    </div>
  );
};

export default LoginPage;

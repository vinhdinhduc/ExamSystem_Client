import { useState } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { login } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAppSelector(
    (state: RootState) => state.auth,
  );

  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  // Bật/tắt hiển thị ký tự mật khẩu (type text ↔ password)
  const [showPassword, setShowPassword] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = await dispatch(login({ usernameOrEmail, password }));
    if (login.fulfilled.match(result)) {
      toast.success("Đăng nhập thành công");
      navigate("/dashboard", { replace: true });
      return;
    }
    if (
      result.payload ===
      "Email chưa được xác thực. Vui lòng kiểm tra hộp thư và click vào link xác thực."
    ) {
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
          onChange={(event) => setUsernameOrEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Mật khẩu</label>
        <div className="login-card__password-field">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="login-card__toggle-password"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? <IoEyeOffOutline size={22} /> : <IoEyeOutline size={22} />}
          </button>
        </div>

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>

        <Link to="/forgot-password" className="muted-link">
          Quên mật khẩu?
        </Link>

        <div className="auth-divider">hoặc</div>

        <Link to="/register" className="muted-link">
          Chưa có tài khoản? Đăng ký ngay
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;

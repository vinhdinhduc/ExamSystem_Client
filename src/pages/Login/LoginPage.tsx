import { useState } from "react";
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

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

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

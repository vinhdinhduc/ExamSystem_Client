import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { resetPassword } from "../../redux/slices/authSlice";

const ResetPasswordPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState((location.state as { email?: string })?.email ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    const result = await dispatch(resetPassword({ email, otp, newPassword, confirmPassword }));
    setLoading(false);

    if (resetPassword.fulfilled.match(result)) {
      toast.success("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.", { autoClose: 5000 });
      navigate("/login", { replace: true });
      return;
    }

    toast.error((result.payload as string) ?? "Đặt lại mật khẩu thất bại");
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Đặt lại mật khẩu</h2>
        <p>Nhập mã OTP đã gửi đến email và mật khẩu mới</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />

        <label htmlFor="otp">Mã OTP</label>
        <input
          id="otp"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Nhập mã 6 số"
          maxLength={6}
          required
        />

        <label htmlFor="newPassword">Mật khẩu mới</label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          required
        />

        <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          required
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </Button>

        <Link to="/forgot-password" className="muted-link">
          Gửi lại mã OTP
        </Link>
      </form>
    </div>
  );
};

export default ResetPasswordPage;

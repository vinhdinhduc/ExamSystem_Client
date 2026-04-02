import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { forgotPassword } from "../../redux/slices/authSlice";

const ForgotPasswordPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const result = await dispatch(forgotPassword(email));
    setLoading(false);

    if (forgotPassword.fulfilled.match(result)) {
      toast.success("Mã OTP đã được gửi đến email của bạn.", { autoClose: 5000 });
      navigate("/reset-password", { state: { email } });
      return;
    }

    toast.error((result.payload as string) ?? "Gửi yêu cầu thất bại");
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Quên mật khẩu</h2>
        <p>Nhập email để nhận mã OTP đặt lại mật khẩu</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@email.com"
          required
        />

        <Button type="submit" fullWidth disabled={loading}>
          {loading ? "Đang gửi..." : "Gửi mã OTP"}
        </Button>

        <Link to="/login" className="muted-link">
          Quay lại đăng nhập
        </Link>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { verifyEmail } from "../../redux/slices/authSlice";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const doVerify = async (token: string) => {
    const result = await dispatch(verifyEmail(token));
    if (verifyEmail.fulfilled.match(result)) {
      setStatus("success");
      setMessage(
        "Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.",
      );
    } else {
      setStatus("error");
      setMessage(
        (result.payload as string) ?? "Token không hợp lệ hoặc đã hết hạn.",
      );
    }
  };

  // Tự động verify nếu có token trên URL
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      setStatus("loading");
      doVerify(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setSubmitting(true);
    await doVerify(manualToken.trim());
    setSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Xác thực Email</h2>

        {status === "loading" && (
          <p className="auth-status auth-status--loading">
            Đang xác thực, vui lòng chờ...
          </p>
        )}

        {status === "success" && (
          <div className="auth-status-wrap">
            <p className="auth-status auth-status--success">✓ {message}</p>
            <Link to="/login" className="muted-link auth-link-block">
              Đăng nhập ngay
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="auth-status-wrap">
            <p className="auth-status auth-status--error">✗ {message}</p>
          </div>
        )}

        {/* Form nhập token thủ công — hiện khi chưa verify hoặc bị lỗi */}
        {(status === "idle" || status === "error") && (
          <form onSubmit={handleManualSubmit} className="auth-manual-form">
            <p className="auth-manual-hint">
              Nếu không click được link trong email, hãy copy token từ link và
              dán vào đây:
            </p>
            <label htmlFor="token">Token xác thực</label>
            <input
              id="token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Dán token từ link email vào đây"
              required
            />
            <Button type="submit" fullWidth disabled={submitting}>
              {submitting ? "Đang xác thực..." : "Xác thực"}
            </Button>
          </form>
        )}

        <Link to="/login" className="muted-link auth-link-block">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmailPage;

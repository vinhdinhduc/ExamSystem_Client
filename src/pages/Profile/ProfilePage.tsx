import { useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  IoCameraOutline,
  IoKeyOutline,
  IoMailOutline,
  IoPersonOutline,
  IoSaveOutline,
  IoShieldCheckmarkOutline,
} from "react-icons/io5";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import userService, { getAvatarUrl } from "../../api/services/userService";
import { authService } from "../../api/services/authService";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { setCredentials } from "../../redux/slices/authSlice";
import type { RootState } from "../../redux/store";

// ─── Tab: Thông tin cá nhân ───────────────────────────────────────────────────
const ProfileInfoTab = () => {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state: RootState) => state.auth);

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await userService.updateMe({
        fullName: fullName || undefined,
        username: username || undefined,
      });
      dispatch(
        setCredentials({
          token: token ?? "",
          user: {
            ...user,
            fullName: updated.fullName,
            username: updated.username,
          },
        }),
      );
      toast.success("Cập nhật thông tin thành công");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fileName = await userService.uploadAvatar(file);
      dispatch(
        setCredentials({
          token: token ?? "",
          user: { ...user, avatar: fileName },
        }),
      );
      toast.success("Cập nhật avatar thành công");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload thất bại";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <form className="profile-page__form" onSubmit={(e) => void handleSave(e)}>
      <div className="profile-page__avatar-row">
        <div className="profile-page__avatar-wrap">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              className="profile-page__avatar-img"
            />
          ) : (
            <div className="profile-page__avatar">
              {(user.fullName || user.username || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <button
            type="button"
            className="profile-page__avatar-edit"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            title="Đổi ảnh đại diện"
          >
            <IoCameraOutline />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="profile-page__avatar-input"
            onChange={(e) => void handleAvatarChange(e)}
          />
        </div>
        <div>
          <div className="profile-page__avatar-name">
            {user.fullName || user.username}
          </div>
          <div className="profile-page__avatar-roles">
            {user.roles?.join(", ") ?? "student"}
          </div>
          {uploadingAvatar && (
            <div className="profile-page__hint">Đang upload...</div>
          )}
        </div>
      </div>

      <div className="profile-page__form-grid">
        <div className="profile-page__field">
          <label className="profile-page__label">Họ và tên</label>
          <input
            className="profile-page__input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div className="profile-page__field">
          <label className="profile-page__label">Username</label>
          <input
            className="profile-page__input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nguyen_van_a"
          />
          <span className="profile-page__hint">Không được chứa dấu cách</span>
        </div>

        <div className="profile-page__field">
          <label className="profile-page__label">Email</label>
          <input
            className="profile-page__input profile-page__input--readonly"
            value={user.email}
            readOnly
          />
          <span className="profile-page__hint">
            Email dùng để đăng nhập, không thể thay đổi
          </span>
        </div>

        <div className="profile-page__field">
          <label className="profile-page__label">Ngày tạo tài khoản</label>
          <input
            className="profile-page__input profile-page__input--readonly"
            value={new Date(user.createdAt).toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            readOnly
          />
        </div>
      </div>

      <div className="profile-page__form-actions">
        <Button type="submit" iconLeft={<IoSaveOutline />} disabled={saving}>
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
  );
};

// ─── Tab: Đổi mật khẩu ───────────────────────────────────────────────────────
// Hỗ trợ 2 cách: nhập mật khẩu hiện tại HOẶC dùng OTP qua email
type PwdMode = "current" | "otp";

const ChangePasswordTab = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const [mode, setMode] = useState<PwdMode>("current");

  // Mode: nhập mật khẩu hiện tại
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  // Mode: OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpNewPassword, setOtpNewPassword] = useState("");
  const [otpConfirmPassword, setOtpConfirmPassword] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  if (!user) return null;

  // --- Mode: mật khẩu hiện tại ---
  const handleChangeWithCurrentPwd = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    setSaving(true);
    try {
      await userService.changeMyPassword({ currentPassword, newPassword });
      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Đổi mật khẩu thất bại. Kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setSaving(false);
    }
  };

  // --- Mode: OTP ---
  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      await authService.forgotPassword(user.email);
      setOtpSent(true);
      toast.success(`Mã OTP đã được gửi đến ${user.email}`);
    } catch {
      toast.error("Gửi OTP thất bại. Vui lòng thử lại.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResetWithOtp = async (
    e: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (otpNewPassword !== otpConfirmPassword) {
      toast.error("Mật khẩu mới và xác nhận không khớp");
      return;
    }
    if (otpNewPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
      return;
    }
    setVerifying(true);
    try {
      await authService.resetPassword({
        email: user.email,
        otp,
        newPassword: otpNewPassword,
        confirmPassword: otpConfirmPassword,
      });
      toast.success("Đặt lại mật khẩu thành công");
      setOtp("");
      setOtpNewPassword("");
      setOtpConfirmPassword("");
      setOtpSent(false);
      setMode("current");
    } catch {
      toast.error("OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="profile-page__form">
      {/* Mode switcher */}
      <div className="profile-page__pwd-modes">
        <button
          type="button"
          className={`profile-page__mode-btn ${mode === "current" ? "profile-page__mode-btn--active" : ""}`}
          onClick={() => setMode("current")}
        >
          <IoKeyOutline />
          Nhập mật khẩu hiện tại
        </button>
        <button
          type="button"
          className={`profile-page__mode-btn ${mode === "otp" ? "profile-page__mode-btn--active" : ""}`}
          onClick={() => {
            setMode("otp");
            setOtpSent(false);
          }}
        >
          <IoMailOutline />
          Quên mật khẩu — dùng OTP
        </button>
      </div>

      {/* Mode: mật khẩu hiện tại */}
      {mode === "current" && (
        <form onSubmit={(e) => void handleChangeWithCurrentPwd(e)}>
          <div className="profile-page__pwd-info">
            <IoKeyOutline className="profile-page__pwd-icon" />
            <p>Nhập mật khẩu hiện tại và mật khẩu mới để đổi.</p>
          </div>

          <div className="profile-page__field profile-page__field--full profile-page__field--spaced">
            <label className="profile-page__label">
              Mật khẩu hiện tại{" "}
              <span className="profile-page__required">*</span>
            </label>
            <input
              className="profile-page__input"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              required
            />
          </div>

          <div className="profile-page__form-grid">
            <div className="profile-page__field">
              <label className="profile-page__label">
                Mật khẩu mới <span className="profile-page__required">*</span>
              </label>
              <input
                className="profile-page__input"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
              />
            </div>
            <div className="profile-page__field">
              <label className="profile-page__label">
                Xác nhận mật khẩu mới{" "}
                <span className="profile-page__required">*</span>
              </label>
              <input
                className={`profile-page__input ${confirmPassword && confirmPassword !== newPassword ? "profile-page__input--error" : ""}`}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <span className="profile-page__error-msg">
                  Mật khẩu không khớp
                </span>
              )}
            </div>
          </div>

          <div className="profile-page__form-actions">
            <Button type="submit" iconLeft={<IoKeyOutline />} disabled={saving}>
              {saving ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </div>
        </form>
      )}

      {/* Mode: OTP */}
      {mode === "otp" && (
        <div>
          <div className="profile-page__pwd-info">
            <IoMailOutline className="profile-page__pwd-icon" />
            <p>
              Hệ thống sẽ gửi mã OTP đến email <strong>{user.email}</strong>.
              Nhập mã OTP và mật khẩu mới để đặt lại.
            </p>
          </div>

          {!otpSent ? (
            <div className="profile-page__otp-send">
              <p className="profile-page__otp-hint">
                Bấm nút bên dưới để nhận mã OTP qua email.
              </p>
              <Button
                iconLeft={<IoMailOutline />}
                onClick={() => void handleSendOtp()}
                disabled={sendingOtp}
              >
                {sendingOtp ? "Đang gửi..." : `Gửi OTP đến ${user.email}`}
              </Button>
            </div>
          ) : (
            <form onSubmit={(e) => void handleResetWithOtp(e)}>
              <div className="profile-page__field profile-page__field--full profile-page__field--spaced">
                <label className="profile-page__label">
                  Mã OTP <span className="profile-page__required">*</span>
                </label>
                <div className="profile-page__otp-row">
                  <input
                    className="profile-page__input profile-page__input--otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Nhập mã 6 số"
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="profile-page__resend-btn"
                    onClick={() => void handleSendOtp()}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? "Đang gửi..." : "Gửi lại"}
                  </button>
                </div>
              </div>

              <div className="profile-page__form-grid">
                <div className="profile-page__field">
                  <label className="profile-page__label">
                    Mật khẩu mới{" "}
                    <span className="profile-page__required">*</span>
                  </label>
                  <input
                    className="profile-page__input"
                    type="password"
                    value={otpNewPassword}
                    onChange={(e) => setOtpNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    required
                  />
                </div>
                <div className="profile-page__field">
                  <label className="profile-page__label">
                    Xác nhận mật khẩu mới{" "}
                    <span className="profile-page__required">*</span>
                  </label>
                  <input
                    className={`profile-page__input ${otpConfirmPassword && otpConfirmPassword !== otpNewPassword ? "profile-page__input--error" : ""}`}
                    type="password"
                    value={otpConfirmPassword}
                    onChange={(e) => setOtpConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                  {otpConfirmPassword &&
                    otpConfirmPassword !== otpNewPassword && (
                      <span className="profile-page__error-msg">
                        Mật khẩu không khớp
                      </span>
                    )}
                </div>
              </div>

              <div className="profile-page__form-actions">
                <Button
                  type="submit"
                  iconLeft={<IoKeyOutline />}
                  disabled={verifying}
                >
                  {verifying ? "Đang xác nhận..." : "Đặt lại mật khẩu"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Profile Page ────────────────────────────────────────────────────────
type ProfileTab = "info" | "password";

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<ProfileTab>("info");
  const { user } = useAppSelector((state: RootState) => state.auth);

  const tabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "Thông tin cá nhân", icon: <IoPersonOutline /> },
    { key: "password", label: "Đổi mật khẩu", icon: <IoKeyOutline /> },
  ];

  return (
    <section className="profile-page">
      <Card title="Hồ sơ cá nhân">
        {user?.roles && user.roles.length > 0 && (
          <div className="profile-page__roles-header">
            <IoShieldCheckmarkOutline />
            <span>Vai trò:</span>
            {user.roles.map((r) => (
              <span key={r} className="profile-page__role-badge">
                {r}
              </span>
            ))}
          </div>
        )}

        <div className="profile-page__tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`profile-page__tab ${activeTab === t.key ? "profile-page__tab--active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className="profile-page__tab-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div className="profile-page__tab-content">
          {activeTab === "info" && <ProfileInfoTab />}
          {activeTab === "password" && <ChangePasswordTab />}
        </div>
      </Card>
    </section>
  );
};

export default ProfilePage;

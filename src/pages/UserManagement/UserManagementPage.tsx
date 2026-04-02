import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  IoAddOutline,
  IoEyeOutline,
  IoLockClosedOutline,
  IoLockOpenOutline,
  IoPencilOutline,
  IoPeopleOutline,
  IoSearchOutline,
  IoTrashOutline,
} from "react-icons/io5";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import Pagination from "../../components/ui/Pagination";
import userService, {
  type UserListDto,
  type UserUpdateDto,
  type UserWithRolesDto,
} from "../../api/services/userService";
import roleService, { type RoleDto } from "../../api/services/roleService";
import { authService } from "../../api/services/authService";

// ─── Modal: Tạo user mới (luồng như register: email + password) ──────────────
interface CreateUserModalProps {
  allRoles: RoleDto[];
  onClose: () => void;
  onSaved: () => void;
}

const CreateUserModal = ({
  allRoles,
  onClose,
  onSaved,
}: CreateUserModalProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkedRoleIds, setCheckedRoleIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleRole = (id: string) =>
    setCheckedRoleIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    try {
      // Dùng authService.register — đúng luồng xác thực như trang Register
      const result = await authService.register({
        username,
        email,
        password,
        confirmPassword,
      });
      toast.success(
        `Đã tạo tài khoản cho ${result.email}. Email xác thực đã được gửi.`,
      );
      // Tìm user vừa tạo để gán roles nếu có
      if (checkedRoleIds.size > 0) {
        const usersData = await userService.getUsers(1, 200);
        const created = usersData.result.find((u) => u.email === email);
        if (created) {
          await userService.assignRoles(created.id, Array.from(checkedRoleIds));
        }
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tạo tài khoản thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open title="Thêm người dùng mới" size="lg" onClose={onClose}>
      <form className="user-mgmt__form" onSubmit={(e) => void handleSubmit(e)}>
        <div className="user-mgmt__create-note">
          Tài khoản sẽ được tạo qua luồng đăng ký — hệ thống gửi email xác thực
          đến người dùng.
        </div>

        <div className="user-mgmt__field">
          <label className="user-mgmt__label">
            Tên đăng nhập <span className="user-mgmt__required">*</span>
          </label>
          <input
            className="user-mgmt__input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoComplete="username"
            required
          />
        </div>

        <div className="user-mgmt__field">
          <label className="user-mgmt__label">
            Email <span className="user-mgmt__required">*</span>
          </label>
          <input
            className="user-mgmt__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            required
          />
        </div>

        <div className="user-mgmt__form-grid">
          <div className="user-mgmt__field">
            <label className="user-mgmt__label">
              Mật khẩu <span className="user-mgmt__required">*</span>
            </label>
            <div className="user-mgmt__pwd-wrap">
              <input
                className="user-mgmt__input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                required
              />
              <button
                type="button"
                className="user-mgmt__pwd-eye"
                onClick={() => setShowPwd((v) => !v)}
                tabIndex={-1}
              >
                <IoEyeOutline />
              </button>
            </div>
          </div>
          <div className="user-mgmt__field">
            <label className="user-mgmt__label">
              Xác nhận mật khẩu <span className="user-mgmt__required">*</span>
            </label>
            <div className="user-mgmt__pwd-wrap">
              <input
                className={`user-mgmt__input ${confirmPassword && confirmPassword !== password ? "user-mgmt__input--error" : ""}`}
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                required
              />
              <button
                type="button"
                className="user-mgmt__pwd-eye"
                onClick={() => setShowConfirm((v) => !v)}
                tabIndex={-1}
              >
                <IoEyeOutline />
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <span className="user-mgmt__error-msg">Mật khẩu không khớp</span>
            )}
          </div>
        </div>

        <div className="user-mgmt__roles-section">
          <label className="user-mgmt__label">Gán Roles (tuỳ chọn)</label>
          <div className="user-mgmt__roles-grid">
            {allRoles.map((r) => (
              <label key={r.id} className="user-mgmt__role-item">
                <input
                  type="checkbox"
                  checked={checkedRoleIds.has(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                <span className="user-mgmt__role-name">{r.name}</span>
                {r.description && (
                  <span className="user-mgmt__role-desc">{r.description}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="user-mgmt__form-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Modal: Sửa user (chỉ cho sửa fullName, username + roles) ────────────────
interface EditUserModalProps {
  user: UserListDto;
  allRoles: RoleDto[];
  onClose: () => void;
  onSaved: () => void;
}

const EditUserModal = ({
  user,
  allRoles,
  onClose,
  onSaved,
}: EditUserModalProps) => {
  const [fullName, setFullName] = useState(user.fullName ?? "");
  const [username, setUsername] = useState(user.username ?? "");
  const [checkedRoleIds, setCheckedRoleIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userService
      .getUserWithRoles(user.id)
      .then((data) => setCheckedRoleIds(new Set(data.roles.map((r) => r.id))))
      .catch(() => {
        /* ignore */
      });
  }, [user.id]);

  const toggleRole = (id: string) =>
    setCheckedRoleIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dto: UserUpdateDto = {
        fullName: fullName || undefined,
        username: username || undefined,
      };
      await userService.updateUser(user.id, dto);
      await userService.assignRoles(user.id, Array.from(checkedRoleIds));
      toast.success("Cập nhật người dùng thành công");
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      title={`Sửa người dùng: ${user.username}`}
      size="lg"
      onClose={onClose}
    >
      <form className="user-mgmt__form" onSubmit={(e) => void handleSubmit(e)}>
        <div className="user-mgmt__form-grid">
          <div className="user-mgmt__field">
            <label className="user-mgmt__label">Họ và tên</label>
            <input
              className="user-mgmt__input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="user-mgmt__field">
            <label className="user-mgmt__label">Username</label>
            <input
              className="user-mgmt__input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nguyen_van_a"
            />
          </div>
          <div className="user-mgmt__field">
            <label className="user-mgmt__label">Email</label>
            <input
              className="user-mgmt__input user-mgmt__input--readonly"
              value={user.email}
              readOnly
            />
            <span className="user-mgmt__hint">Email không thể thay đổi</span>
          </div>
          <div className="user-mgmt__field">
            <label className="user-mgmt__label">Ngày tạo</label>
            <input
              className="user-mgmt__input user-mgmt__input--readonly"
              value={new Date(user.createdAt).toLocaleDateString("vi-VN")}
              readOnly
            />
          </div>
        </div>

        <div className="user-mgmt__roles-section">
          <label className="user-mgmt__label">Roles</label>
          <div className="user-mgmt__roles-grid">
            {allRoles.map((r) => (
              <label key={r.id} className="user-mgmt__role-item">
                <input
                  type="checkbox"
                  checked={checkedRoleIds.has(r.id)}
                  onChange={() => toggleRole(r.id)}
                />
                <span className="user-mgmt__role-name">{r.name}</span>
                {r.description && (
                  <span className="user-mgmt__role-desc">{r.description}</span>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="user-mgmt__form-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Modal: Xem chi tiết user ─────────────────────────────────────────────────
interface ViewUserModalProps {
  userId: string;
  onClose: () => void;
  onEdit: () => void;
}

const ViewUserModal = ({ userId, onClose, onEdit }: ViewUserModalProps) => {
  const [detail, setDetail] = useState<UserWithRolesDto | null>(null);

  useEffect(() => {
    userService
      .getUserWithRoles(userId)
      .then(setDetail)
      .catch(() => toast.error("Không thể tải thông tin người dùng"));
  }, [userId]);

  if (!detail) {
    return (
      <Modal open title="Chi tiết người dùng" onClose={onClose}>
        <div className="user-mgmt__detail-loading">Đang tải...</div>
      </Modal>
    );
  }

  return (
    <Modal open title="Chi tiết người dùng" size="lg" onClose={onClose}>
      <div className="user-mgmt__detail">
        {/* Avatar + tên */}
        <div className="user-mgmt__detail-header">
          <div className="user-mgmt__detail-avatar">
            {(detail.fullName || detail.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>
          <div>
            <div className="user-mgmt__detail-name">
              {detail.fullName || "—"}
            </div>
            <div className="user-mgmt__detail-username">@{detail.username}</div>
            <span
              className={`user-mgmt__status ${detail.isActive ? "user-mgmt__status--active" : "user-mgmt__status--inactive"}`}
            >
              {detail.isActive ? "Hoạt động" : "Bị khóa"}
            </span>
          </div>
        </div>

        {/* Thông tin */}
        <div className="user-mgmt__detail-grid">
          <div className="user-mgmt__detail-item">
            <span className="user-mgmt__detail-label">Email</span>
            <span className="user-mgmt__detail-value">{detail.email}</span>
          </div>
          <div className="user-mgmt__detail-item">
            <span className="user-mgmt__detail-label">Ngày tạo</span>
            <span className="user-mgmt__detail-value">
              {new Date(detail.createdAt).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="user-mgmt__detail-item user-mgmt__detail-item--full">
            <span className="user-mgmt__detail-label">Roles được gán</span>
            <div className="user-mgmt__role-badges">
              {detail.roles.length > 0 ? (
                detail.roles.map((r) => (
                  <span
                    key={r.id}
                    className="user-mgmt__role-badge"
                    title={r.description ?? ""}
                  >
                    {r.name}
                  </span>
                ))
              ) : (
                <span className="user-mgmt__no-role">Chưa có role nào</span>
              )}
            </div>
          </div>
        </div>

        <div className="user-mgmt__detail-actions">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
          <Button iconLeft={<IoPencilOutline />} onClick={onEdit}>
            Sửa
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const UserManagementPage = () => {
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [allRoles, setAllRoles] = useState<RoleDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterActive, setFilterActive] = useState<
    "all" | "active" | "inactive"
  >("all");
  const pageSize = 20;
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  type ModalState =
    | { type: "none" }
    | { type: "create" }
    | { type: "edit"; user: UserListDto }
    | { type: "view"; userId: string; user: UserListDto };

  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [deleteTarget, setDeleteTarget] = useState<UserListDto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lockTarget, setLockTarget] = useState<UserListDto | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getUsers(page, pageSize),
        roleService.getRoles(),
      ]);
      setUsers(usersData.result);
      setTotal(usersData.meta.total);
      setAllRoles(rolesData.result);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearch(value);
      setPage(1);
    }, 400);
  };

  const displayed = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.fullName ?? "").toLowerCase().includes(q);
    const matchFilter =
      filterActive === "all" ||
      (filterActive === "active" && u.isActive) ||
      (filterActive === "inactive" && !u.isActive);
    return matchSearch && matchFilter;
  });

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handleSaved = () => {
    setModal({ type: "none" });
    void load();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userService.deleteUser(deleteTarget.id);
      toast.success(`Đã xóa người dùng "${deleteTarget.username}"`);
      setDeleteTarget(null);
      void load();
    } catch {
      toast.error("Xóa người dùng thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleLockConfirm = async () => {
    if (!lockTarget) return;
    setToggling(true);
    try {
      const updated = await userService.toggleLock(lockTarget.id);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id ? { ...u, isActive: updated.isActive } : u,
        ),
      );
      toast.success(
        `Đã ${updated.isActive ? "mở khóa" : "khóa"} tài khoản "${updated.username}"`,
      );
      setLockTarget(null);
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setToggling(false);
    }
  };

  return (
    <section className="user-mgmt">
      <Card
        title="Quản lý người dùng"
        subtitle={`Tổng cộng ${total} tài khoản`}
        actions={
          <Button
            iconLeft={<IoAddOutline />}
            onClick={() => setModal({ type: "create" })}
          >
            Thêm người dùng
          </Button>
        }
      >
        {/* Toolbar */}
        <div className="user-mgmt__toolbar">
          <div className="user-mgmt__search-wrap">
            <IoSearchOutline className="user-mgmt__search-icon" />
            <input
              className="user-mgmt__search"
              placeholder="Tìm theo tên, email, username..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="user-mgmt__filters">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className={`user-mgmt__filter-btn ${filterActive === f ? "user-mgmt__filter-btn--active" : ""}`}
                onClick={() => {
                  setFilterActive(f);
                  setPage(1);
                }}
              >
                {f === "all"
                  ? "Tất cả"
                  : f === "active"
                    ? "Đang hoạt động"
                    : "Bị khóa"}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <Table
          columns={[
            {
              key: "fullName",
              title: "Người dùng",
              render: (u) => (
                <div className="user-mgmt__user-cell">
                  <div className="user-mgmt__avatar">
                    {(u.fullName || u.username || "U").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-mgmt__user-name">
                      {u.fullName || "—"}
                    </div>
                    <div className="user-mgmt__user-sub">@{u.username}</div>
                  </div>
                </div>
              ),
            },
            { key: "email", title: "Email" },
            {
              key: "roles",
              title: "Roles",
              render: (u) =>
                u.roles?.length ? (
                  <div className="user-mgmt__role-badges">
                    {u.roles.map((r) => (
                      <span key={r} className="user-mgmt__role-badge">
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="user-mgmt__no-role">—</span>
                ),
            },
            {
              key: "createdAt",
              title: "Ngày tạo",
              render: (u) => new Date(u.createdAt).toLocaleDateString("vi-VN"),
            },
            {
              key: "isActive",
              title: "Trạng thái",
              render: (u) => (
                <span
                  className={`user-mgmt__status ${u.isActive ? "user-mgmt__status--active" : "user-mgmt__status--inactive"}`}
                >
                  {u.isActive ? "Hoạt động" : "Bị khóa"}
                </span>
              ),
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (u) => (
                <div className="user-mgmt__row-actions">
                  <button
                    type="button"
                    className="user-mgmt__icon-btn user-mgmt__icon-btn--view"
                    title="Xem chi tiết"
                    onClick={() =>
                      setModal({ type: "view", userId: u.id, user: u })
                    }
                  >
                    <IoEyeOutline />
                  </button>
                  <button
                    type="button"
                    className="user-mgmt__icon-btn user-mgmt__icon-btn--edit"
                    title="Sửa"
                    onClick={() => setModal({ type: "edit", user: u })}
                  >
                    <IoPencilOutline />
                  </button>
                  <button
                    type="button"
                    className={`user-mgmt__icon-btn ${u.isActive ? "user-mgmt__icon-btn--lock" : "user-mgmt__icon-btn--unlock"}`}
                    title={u.isActive ? "Khóa tài khoản" : "Mở khóa"}
                    onClick={() => setLockTarget(u)}
                  >
                    {u.isActive ? (
                      <IoLockClosedOutline />
                    ) : (
                      <IoLockOpenOutline />
                    )}
                  </button>
                  <button
                    type="button"
                    className="user-mgmt__icon-btn user-mgmt__icon-btn--delete"
                    title="Xóa"
                    onClick={() => setDeleteTarget(u)}
                  >
                    <IoTrashOutline />
                  </button>
                </div>
              ),
            },
          ]}
          data={displayed}
          rowKey={(u) => u.id}
          emptyText={
            search
              ? `Không tìm thấy kết quả cho "${search}"`
              : "Chưa có người dùng nào"
          }
        />

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </Card>

      {/* Stats */}
      <div className="user-mgmt__stats">
        <div className="user-mgmt__stat-card">
          <IoPeopleOutline className="user-mgmt__stat-icon" />
          <div>
            <div className="user-mgmt__stat-value">{total}</div>
            <div className="user-mgmt__stat-label">Tổng tài khoản</div>
          </div>
        </div>
        <div className="user-mgmt__stat-card user-mgmt__stat-card--active">
          <IoLockOpenOutline className="user-mgmt__stat-icon" />
          <div>
            <div className="user-mgmt__stat-value">
              {users.filter((u) => u.isActive).length}
            </div>
            <div className="user-mgmt__stat-label">Đang hoạt động</div>
          </div>
        </div>
        <div className="user-mgmt__stat-card user-mgmt__stat-card--locked">
          <IoLockClosedOutline className="user-mgmt__stat-icon" />
          <div>
            <div className="user-mgmt__stat-value">
              {users.filter((u) => !u.isActive).length}
            </div>
            <div className="user-mgmt__stat-label">Bị khóa</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal.type === "create" && (
        <CreateUserModal
          allRoles={allRoles}
          onClose={() => setModal({ type: "none" })}
          onSaved={handleSaved}
        />
      )}
      {modal.type === "edit" && (
        <EditUserModal
          user={modal.user}
          allRoles={allRoles}
          onClose={() => setModal({ type: "none" })}
          onSaved={handleSaved}
        />
      )}
      {modal.type === "view" && (
        <ViewUserModal
          userId={modal.userId}
          onClose={() => setModal({ type: "none" })}
          onEdit={() => {
            const u = modal.user;
            setModal({ type: "edit", user: u });
          }}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Xóa người dùng"
        message={`Bạn có chắc muốn xóa tài khoản "${deleteTarget?.fullName ?? deleteTarget?.username}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Toggle Lock Confirm */}
      <ConfirmModal
        open={lockTarget !== null}
        title={lockTarget?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        message={
          lockTarget?.isActive
            ? `Khóa tài khoản "${lockTarget?.username}"? Người dùng sẽ không thể đăng nhập.`
            : `Mở khóa tài khoản "${lockTarget?.username}"?`
        }
        confirmLabel={lockTarget?.isActive ? "Khóa" : "Mở khóa"}
        variant={lockTarget?.isActive ? "danger" : "primary"}
        loading={toggling}
        onConfirm={() => void handleToggleLockConfirm()}
        onCancel={() => setLockTarget(null)}
      />
    </section>
  );
};

export default UserManagementPage;

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import roleService, {
  type PermissionDto,
  type RoleDto,
  type RoleWithPermissionsDto,
} from "../../api/services/roleService";
import userService, { type UserListDto } from "../../api/services/userService";

type Tab = "roles" | "permissions" | "users";

// ─── Roles Tab ────────────────────────────────────────────────────────────────
const RolesTab = () => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);

  // Create/edit role modal
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  // Assign permissions modal
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissionsDto | null>(null);
  const [checkedPermIds, setCheckedPermIds] = useState<Set<string>>(new Set());

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rolesData, permsData] = await Promise.all([
        roleService.getRoles(),
        roleService.getPermissions(),
      ]);
      setRoles(rolesData.result);
      setAllPermissions(permsData.result);
    } catch {
      toast.error("Không thể tải danh sách roles");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleDesc("");
    setRoleModalOpen(true);
  };

  const openEdit = (role: RoleDto) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description ?? "");
    setRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, { name: roleName, description: roleDesc });
        toast.success("Cập nhật role thành công");
      } else {
        await roleService.createRole({ name: roleName, description: roleDesc });
        toast.success("Tạo role thành công");
      }
      setRoleModalOpen(false);
      void load();
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roleService.deleteRole(deleteTarget.id);
      toast.success("Đã xóa role");
      setDeleteTarget(null);
      void load();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const openAssignPerms = async (role: RoleDto) => {
    try {
      const data = await roleService.getRoleWithPermissions(role.id);
      setSelectedRole(data);
      setCheckedPermIds(new Set(data.permissions.map((p) => p.id)));
      setPermModalOpen(true);
    } catch {
      toast.error("Không thể tải permissions của role");
    }
  };

  const handleSavePerms = async () => {
    if (!selectedRole) return;
    try {
      await roleService.assignPermissions(selectedRole.id, Array.from(checkedPermIds));
      toast.success("Cập nhật permissions thành công");
      setPermModalOpen(false);
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const togglePerm = (id: string) => {
    setCheckedPermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="admin-page__toolbar">
        <h3 className="admin-page__section-title">Danh sách Roles</h3>
        <Button onClick={openCreate}>+ Thêm Role</Button>
      </div>

      <Table
        columns={[
          { key: "name", title: "Tên Role" },
          { key: "description", title: "Mô tả", render: (r) => r.description ?? "—" },
          {
            key: "createdAt",
            title: "Ngày tạo",
            render: (r) => new Date(r.createdAt).toLocaleDateString("vi-VN"),
          },
          {
            key: "actions",
            title: "Thao tác",
            render: (r) => (
              <div className="admin-page__row-actions">
                <Button variant="outline" onClick={() => void openAssignPerms(r)}>
                  Permissions
                </Button>
                <Button variant="outline" onClick={() => openEdit(r)}>
                  Sửa
                </Button>
                <Button variant="danger" onClick={() => setDeleteTarget(r)}>
                  Xóa
                </Button>
              </div>
            ),
          },
        ]}
        data={roles}
        rowKey={(r) => r.id}
      />

      {/* Create/Edit Role Modal */}
      <Modal
        open={roleModalOpen}
        title={editingRole ? "Sửa Role" : "Tạo Role mới"}
        onClose={() => setRoleModalOpen(false)}
      >
        <form className="admin-page__form" onSubmit={(e) => void handleSaveRole(e)}>
          <label className="admin-page__label">Tên Role <span className="admin-page__required">*</span></label>
          <input
            className="admin-page__input"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Ví dụ: admin, teacher, student"
            required
          />
          <label className="admin-page__label">Mô tả</label>
          <input
            className="admin-page__input"
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
            placeholder="Mô tả vai trò (tuỳ chọn)"
          />
          <div className="admin-page__form-actions">
            <Button type="button" variant="ghost" onClick={() => setRoleModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit">{editingRole ? "Lưu thay đổi" : "Tạo mới"}</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Permissions Modal */}
      <Modal
        open={permModalOpen}
        title={`Permissions của role: ${selectedRole?.name ?? ""}`}
        onClose={() => setPermModalOpen(false)}
      >
        <div className="admin-page__perm-list">
          {allPermissions.length === 0 && (
            <p className="admin-page__empty">Chưa có permissions nào</p>
          )}
          {allPermissions.map((p) => (
            <label key={p.id} className="admin-page__perm-item">
              <input
                type="checkbox"
                checked={checkedPermIds.has(p.id)}
                onChange={() => togglePerm(p.id)}
              />
              <span className="admin-page__perm-code">{p.code}</span>
              {p.description && (
                <span className="admin-page__perm-desc">{p.description}</span>
              )}
            </label>
          ))}
        </div>
        <div className="admin-page__form-actions">
          <Button variant="ghost" onClick={() => setPermModalOpen(false)}>Hủy</Button>
          <Button onClick={() => void handleSavePerms()}>Lưu permissions</Button>
        </div>
      </Modal>

      {/* Delete Role Confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Xóa Role"
        message={`Bạn có chắc muốn xóa role "${deleteTarget?.name ?? ""}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

// ─── Permissions Tab ──────────────────────────────────────────────────────────
const PermissionsTab = () => {
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PermissionDto | null>(null);
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<PermissionDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await roleService.getPermissions();
      setPermissions(data.result);
    } catch {
      toast.error("Không thể tải permissions");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setCode("");
    setDesc("");
    setModalOpen(true);
  };

  const openEdit = (p: PermissionDto) => {
    setEditing(p);
    setCode(p.code);
    setDesc(p.description ?? "");
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      if (editing) {
        await roleService.updatePermission(editing.id, { code, description: desc });
        toast.success("Cập nhật thành công");
      } else {
        await roleService.createPermission({ code, description: desc });
        toast.success("Tạo permission thành công");
      }
      setModalOpen(false);
      void load();
    } catch {
      toast.error("Thao tác thất bại");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await roleService.deletePermission(deleteTarget.id);
      toast.success("Đã xóa");
      setDeleteTarget(null);
      void load();
    } catch {
      toast.error("Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-page__toolbar">
        <h3 className="admin-page__section-title">Danh sách Permissions</h3>
        <Button onClick={openCreate}>+ Thêm Permission</Button>
      </div>

      <Table
        columns={[
          { key: "code", title: "Mã Permission" },
          { key: "description", title: "Mô tả", render: (p) => p.description ?? "—" },
          {
            key: "actions",
            title: "Thao tác",
            render: (p) => (
              <div className="admin-page__row-actions">
                <Button variant="outline" onClick={() => openEdit(p)}>Sửa</Button>
                <Button variant="danger" onClick={() => setDeleteTarget(p)}>Xóa</Button>
              </div>
            ),
          },
        ]}
        data={permissions}
        rowKey={(p) => p.id}
      />

      <Modal
        open={modalOpen}
        title={editing ? "Sửa Permission" : "Tạo Permission mới"}
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-page__form" onSubmit={(e) => void handleSave(e)}>
          <label className="admin-page__label">Mã Permission <span className="admin-page__required">*</span></label>
          <input
            className="admin-page__input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ví dụ: exam:create, user:manage"
            required
          />
          <label className="admin-page__label">Mô tả</label>
          <input
            className="admin-page__input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Mô tả quyền (tuỳ chọn)"
          />
          <div className="admin-page__form-actions">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit">{editing ? "Lưu thay đổi" : "Tạo mới"}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Permission Confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Xóa Permission"
        message={`Bạn có chắc muốn xóa permission "${deleteTarget?.code ?? ""}"?`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

// ─── Users Tab ────────────────────────────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [allRoles, setAllRoles] = useState<RoleDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // Assign roles modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListDto | null>(null);
  const [userRoleNames, setUserRoleNames] = useState<string[]>([]);
  const [checkedRoleIds, setCheckedRoleIds] = useState<Set<string>>(new Set());

  // Toggle lock confirm
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
      toast.error("Không thể tải danh sách users");
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAssignRoles = async (user: UserListDto) => {
    try {
      const data = await userService.getUserWithRoles(user.id);
      setSelectedUser(user);
      setUserRoleNames(data.roles.map((r) => r.name));
      setCheckedRoleIds(new Set(data.roles.map((r) => r.id)));
      setAssignModalOpen(true);
    } catch {
      toast.error("Không thể tải roles của user");
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    try {
      await userService.assignRoles(selectedUser.id, Array.from(checkedRoleIds));
      toast.success("Cập nhật roles thành công");
      setAssignModalOpen(false);
      void load();
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const handleToggleLockConfirm = async () => {
    if (!lockTarget) return;
    setToggling(true);
    try {
      const updated = await userService.toggleLock(lockTarget.id);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? { ...x, isActive: updated.isActive } : x)));
      toast.success(`Đã ${updated.isActive ? "mở khóa" : "khóa"} tài khoản "${updated.username}"`);
      setLockTarget(null);
    } catch {
      toast.error("Thao tác thất bại");
    } finally {
      setToggling(false);
    }
  };

  const toggleRole = (id: string) => {
    setCheckedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <>
      <div className="admin-page__toolbar">
        <h3 className="admin-page__section-title">Danh sách Users ({total})</h3>
      </div>

      <Table
        columns={[
          { key: "username", title: "Username" },
          { key: "fullName", title: "Họ tên" },
          { key: "email", title: "Email" },
          {
            key: "roles",
            title: "Roles",
            render: (u) => (u.roles?.length ? u.roles.join(", ") : "—"),
          },
          {
            key: "isActive",
            title: "Trạng thái",
            render: (u) => (
              <span className={`admin-page__status ${u.isActive ? "admin-page__status--active" : "admin-page__status--inactive"}`}>
                {u.isActive ? "Hoạt động" : "Bị khóa"}
              </span>
            ),
          },
          {
            key: "actions",
            title: "Thao tác",
            render: (u) => (
              <div className="admin-page__row-actions">
                <Button variant="outline" onClick={() => void openAssignRoles(u)}>
                  Gán Role
                </Button>
                <Button
                  variant={u.isActive ? "danger" : "outline"}
                  onClick={() => setLockTarget(u)}
                >
                  {u.isActive ? "Khóa" : "Mở khóa"}
                </Button>
              </div>
            ),
          },
        ]}
        data={users}
        rowKey={(u) => u.id}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-page__pagination">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Trước
          </Button>
          <span className="admin-page__page-info">Trang {page} / {totalPages}</span>
          <Button variant="ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Tiếp →
          </Button>
        </div>
      )}

      {/* Assign Roles Modal */}
      <Modal
        open={assignModalOpen}
        title={`Gán Role cho: ${selectedUser?.fullName ?? selectedUser?.username ?? ""}`}
        onClose={() => setAssignModalOpen(false)}
      >
        <p className="admin-page__modal-hint">
          Roles hiện tại: <strong>{userRoleNames.join(", ") || "Chưa có"}</strong>
        </p>
        <div className="admin-page__perm-list">
          {allRoles.map((r) => (
            <label key={r.id} className="admin-page__perm-item">
              <input
                type="checkbox"
                checked={checkedRoleIds.has(r.id)}
                onChange={() => toggleRole(r.id)}
              />
              <span className="admin-page__perm-code">{r.name}</span>
              {r.description && (
                <span className="admin-page__perm-desc">{r.description}</span>
              )}
            </label>
          ))}
        </div>
        <div className="admin-page__form-actions">
          <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>Hủy</Button>
          <Button onClick={() => void handleSaveRoles()}>Lưu</Button>
        </div>
      </Modal>

      {/* Toggle Lock Confirm */}
      <ConfirmModal
        open={lockTarget !== null}
        title={lockTarget?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
        message={
          lockTarget?.isActive
            ? `Bạn có chắc muốn khóa tài khoản "${lockTarget?.username}"? Người dùng sẽ không thể đăng nhập.`
            : `Bạn có chắc muốn mở khóa tài khoản "${lockTarget?.username}"?`
        }
        confirmLabel={lockTarget?.isActive ? "Khóa" : "Mở khóa"}
        variant={lockTarget?.isActive ? "danger" : "primary"}
        loading={toggling}
        onConfirm={() => void handleToggleLockConfirm()}
        onCancel={() => setLockTarget(null)}
      />
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RolesPermissionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("roles");

  return (
    <section className="admin-page">
      <Card title="Quản lý Roles & Permissions">
        <div className="admin-page__tabs">
          {(["roles", "permissions", "users"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-page__tab ${activeTab === tab ? "admin-page__tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "roles" ? "Roles" : tab === "permissions" ? "Permissions" : "Users"}
            </button>
          ))}
        </div>

        <div className="admin-page__tab-content">
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "permissions" && <PermissionsTab />}
          {activeTab === "users" && <UsersTab />}
        </div>
      </Card>
    </section>
  );
};

export default RolesPermissionsPage;

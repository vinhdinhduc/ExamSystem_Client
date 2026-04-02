import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { IoArrowForwardOutline, IoPeopleOutline } from "react-icons/io5";
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

type Tab = "roles" | "permissions";

// ─── Roles Tab ────────────────────────────────────────────────────────────────
const RolesTab = () => {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [allPermissions, setAllPermissions] = useState<PermissionDto[]>([]);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] =
    useState<RoleWithPermissionsDto | null>(null);
  const [checkedPermIds, setCheckedPermIds] = useState<Set<string>>(new Set());

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
      toast.error("Không thể tải danh sách vai trò");
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

  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, {
          name: roleName,
          description: roleDesc,
        });
        toast.success("Cập nhật vai trò thành công");
      } else {
        await roleService.createRole({ name: roleName, description: roleDesc });
        toast.success("Tạo vai trò thành công");
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
      toast.success("Đã xóa vai trò");
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
      toast.error("Không thể tải quyền của vai trò");
    }
  };

  const handleSavePerms = async () => {
    if (!selectedRole) return;
    try {
      await roleService.assignPermissions(
        selectedRole.id,
        Array.from(checkedPermIds),
      );
      toast.success("Cập nhật quyền hạn thành công");
      setPermModalOpen(false);
    } catch {
      toast.error("Cập nhật thất bại");
    }
  };

  const togglePerm = (id: string) => {
    setCheckedPermIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <div className="admin-page__toolbar">
        <h3 className="admin-page__section-title">Danh sách vai trò</h3>
        <Button onClick={openCreate}>+ Thêm vai trò</Button>
      </div>

      <Table
        columns={[
          { key: "name", title: "Tên vai trò" },
          {
            key: "description",
            title: "Mô tả",
            render: (r) => r.description ?? "—",
          },
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
                <Button
                  variant="outline"
                  onClick={() => void openAssignPerms(r)}
                >
                  Phân quyền
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
        title={editingRole ? "Sửa vai trò" : "Tạo vai trò mới"}
        onClose={() => setRoleModalOpen(false)}
      >
        <form
          className="admin-page__form"
          onSubmit={(e) => void handleSaveRole(e)}
        >
          <label className="admin-page__label">
            Tên vai trò <span className="admin-page__required">*</span>
          </label>
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRoleModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {editingRole ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Permissions Modal */}
      <Modal
        open={permModalOpen}
        title={`Quyền hạn của vai trò: ${selectedRole?.name ?? ""}`}
        onClose={() => setPermModalOpen(false)}
      >
        <div className="admin-page__perm-list">
          {allPermissions.length === 0 && (
            <p className="admin-page__empty">Chưa có quyền hạn nào</p>
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
          <Button variant="ghost" onClick={() => setPermModalOpen(false)}>
            Hủy
          </Button>
          <Button onClick={() => void handleSavePerms()}>Lưu quyền hạn</Button>
        </div>
      </Modal>

      {/* Delete Role Confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Xóa vai trò"
        message={`Bạn có chắc muốn xóa vai trò "${deleteTarget?.name ?? ""}"? Hành động này không thể hoàn tác.`}
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

  const [deleteTarget, setDeleteTarget] = useState<PermissionDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await roleService.getPermissions();
      setPermissions(data.result);
    } catch {
      toast.error("Không thể tải danh sách quyền hạn");
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

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      if (editing) {
        await roleService.updatePermission(editing.id, {
          code,
          description: desc,
        });
        toast.success("Cập nhật thành công");
      } else {
        await roleService.createPermission({ code, description: desc });
        toast.success("Tạo quyền hạn thành công");
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
        <h3 className="admin-page__section-title">Danh sách quyền hạn</h3>
        <Button onClick={openCreate}>+ Thêm quyền hạn</Button>
      </div>

      <Table
        columns={[
          { key: "code", title: "Mã quyền hạn" },
          {
            key: "description",
            title: "Mô tả",
            render: (p) => p.description ?? "—",
          },
          {
            key: "actions",
            title: "Thao tác",
            render: (p) => (
              <div className="admin-page__row-actions">
                <Button variant="outline" onClick={() => openEdit(p)}>
                  Sửa
                </Button>
                <Button variant="danger" onClick={() => setDeleteTarget(p)}>
                  Xóa
                </Button>
              </div>
            ),
          },
        ]}
        data={permissions}
        rowKey={(p) => p.id}
      />

      <Modal
        open={modalOpen}
        title={editing ? "Sửa quyền hạn" : "Tạo quyền hạn mới"}
        onClose={() => setModalOpen(false)}
      >
        <form className="admin-page__form" onSubmit={(e) => void handleSave(e)}>
          <label className="admin-page__label">
            Mã quyền hạn <span className="admin-page__required">*</span>
          </label>
          <input
            className="admin-page__input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ví dụ: EXAM_CREATE, USER_MANAGE"
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit">
              {editing ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Xóa quyền hạn"
        message={`Bạn có chắc muốn xóa quyền hạn "${deleteTarget?.code ?? ""}"?`}
        confirmLabel="Xóa"
        loading={deleting}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

// ─── Users shortcut (không lặp code — chuyển sang trang riêng) ───────────────
const UsersShortcut = () => {
  const navigate = useNavigate();
  return (
    <div className="admin-page__users-shortcut">
      <div className="admin-page__users-shortcut-icon">
        <IoPeopleOutline />
      </div>
      <div>
        <div className="admin-page__users-shortcut-title">
          Quản lý người dùng
        </div>
        <div className="admin-page__users-shortcut-desc">
          Tạo, sửa, xóa, khóa tài khoản và gán vai trò cho người dùng tại trang
          quản lý riêng.
        </div>
      </div>
      <Button
        iconRight={<IoArrowForwardOutline />}
        onClick={() => navigate("/admin/users")}
      >
        Đến trang quản lý
      </Button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RolesPermissionsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>("roles");

  const tabLabels: Record<Tab, string> = {
    roles: "Vai trò",
    permissions: "Quyền hạn",
  };

  return (
    <section className="admin-page">
      <Card title="Quản lý vai trò và quyền hạn">
        <div className="admin-page__tabs">
          {(["roles", "permissions"] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-page__tab ${activeTab === tab ? "admin-page__tab--active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="admin-page__tab-content">
          {activeTab === "roles" && <RolesTab />}
          {activeTab === "permissions" && <PermissionsTab />}
        </div>
      </Card>

      {/* Shortcut sang trang quản lý người dùng — không lặp code */}
      <UsersShortcut />
    </section>
  );
};

export default RolesPermissionsPage;

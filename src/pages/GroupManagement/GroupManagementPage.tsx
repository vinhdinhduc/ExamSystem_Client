import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import {
  IoAddOutline,
  IoPersonAddOutline,
  IoTrashOutline,
  IoPeopleOutline,
  IoChevronDownOutline,
  IoChevronUpOutline,
} from "react-icons/io5";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import {
  createGroup,
  fetchGroups,
  addGroupMember,
  removeGroupMember,
} from "../../redux/slices/groupSlice";
import type { RootState } from "../../redux/store";
import type { GroupPayload, Group } from "../../types/group";
import userService from "../../api/services/userService";
import type { UserListDto } from "../../api/services/userService";
import { canPerformFeature } from "../../utils/roleHelper";

const GroupManagementPage = () => {
  const dispatch = useAppDispatch();
  const { groups, loading } = useAppSelector((state: RootState) => state.group);
  const { user } = useAppSelector((state: RootState) => state.auth);

  const { register, handleSubmit, reset } = useForm<GroupPayload>();

  // Role-based access
  const canManageGroups = canPerformFeature(
    user?.roles ?? [],
    "canManageGroups",
  );

  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [addMemberModal, setAddMemberModal] = useState<Group | null>(null);
  const [users, setUsers] = useState<UserListDto[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchGroups());
  }, [dispatch]);

  const onSubmit = handleSubmit(async (payload) => {
    const result = await dispatch(
      createGroup({
        ...payload,
        createdByUserId: user?.id ?? "",
      }),
    );
    if (createGroup.fulfilled.match(result)) {
      toast.success("Tạo nhóm thành công");
      reset({ code: "", name: "", description: "" });
    } else {
      toast.error(result.payload ?? "Không thể tạo nhóm");
    }
  });

  const openAddMemberModal = async (group: Group) => {
    setAddMemberModal(group);
    setUserSearch("");
    try {
      const result = await userService.getUsers(1, 100);
      setUsers(result?.result ?? []);
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!addMemberModal) return;
    setAddingUserId(userId);
    const result = await dispatch(
      addGroupMember({ groupId: addMemberModal.id, userId }),
    );
    if (addGroupMember.fulfilled.match(result)) {
      toast.success("Đã thêm thành viên");
    } else {
      toast.error(result.payload ?? "Không thể thêm thành viên");
    }
    setAddingUserId(null);
  };

  const handleRemoveMember = async (
    groupId: number,
    userId: string,
    name: string,
  ) => {
    if (!window.confirm(`Xóa "${name}" khỏi nhóm?`)) return;
    const result = await dispatch(removeGroupMember({ groupId, userId }));
    if (removeGroupMember.fulfilled.match(result)) {
      toast.success("Đã xóa thành viên");
    } else {
      toast.error(result.payload ?? "Không thể xóa thành viên");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      !addMemberModal?.members.some((m) => m.userId === u.id) &&
      (u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())),
  );

  if (loading) return <LoadingSpinner />;

  // Show access denied for students
  if (!canManageGroups) {
    return (
      <div className="group-page">
        <div className="page-header">
          <div className="page-header__text">
            <h1 className="page-header__title">Quản lý nhóm / lớp</h1>
          </div>
        </div>
        <Card>
          <div className="group-page__empty">
            <IoPeopleOutline />
            <p>
              Bạn không có quyền truy cập trang này. Chỉ giáo viên và quản trị
              viên có thể quản lý nhóm.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="group-page">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">Quản lý nhóm / lớp</h1>
          <p className="page-header__subtitle">
            Tạo và quản lý các nhóm học sinh trong hệ thống.
          </p>
        </div>
      </div>

      {/* Form tạo nhóm */}
      <Card title="Tạo nhóm mới">
        <form className="group-page__form" onSubmit={(e) => void onSubmit(e)}>
          <input
            {...register("code", { required: true })}
            className="form-input"
            placeholder="Mã nhóm (VD: LOP10A1)"
          />
          <input
            {...register("name", { required: true })}
            className="form-input"
            placeholder="Tên nhóm / lớp"
          />
          <input
            {...register("description")}
            className="form-input"
            placeholder="Mô tả (không bắt buộc)"
          />
          <Button type="submit" iconLeft={<IoAddOutline />}>
            Tạo nhóm
          </Button>
        </form>
      </Card>

      {/* Danh sách nhóm */}
      {!Array.isArray(groups) || groups.length === 0 ? (
        <Card>
          <div className="group-page__empty">
            <IoPeopleOutline />
            <p>Chưa có nhóm nào. Hãy tạo nhóm đầu tiên.</p>
          </div>
        </Card>
      ) : (
        <div className="group-page__list">
          {groups.map((group) => (
            <div key={group.id} className="group-page__item">
              {/* Group header */}
              <div
                className="group-page__item-header"
                onClick={() =>
                  setExpandedGroup(expandedGroup === group.id ? null : group.id)
                }
              >
                <div className="group-page__item-info">
                  <div className="group-page__item-avatar">
                    {group.name.charAt(0)}
                  </div>
                  <div>
                    <strong>{group.name}</strong>
                    <span className="group-page__item-code">{group.code}</span>
                    {group.description && (
                      <p className="group-page__item-desc">
                        {group.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="group-page__item-meta">
                  <span className="group-page__member-count">
                    <IoPeopleOutline /> {group.members.length} thành viên
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<IoPersonAddOutline />}
                    onClick={(e) => {
                      e.stopPropagation();
                      void openAddMemberModal(group);
                    }}
                  >
                    Thêm thành viên
                  </Button>
                  {expandedGroup === group.id ? (
                    <IoChevronUpOutline />
                  ) : (
                    <IoChevronDownOutline />
                  )}
                </div>
              </div>

              {/* Member list */}
              {expandedGroup === group.id && (
                <div className="group-page__member-list">
                  {group.members.length === 0 ? (
                    <p className="group-page__no-member">
                      Chưa có thành viên nào
                    </p>
                  ) : (
                    group.members.map((member) => (
                      <div
                        key={`${member.groupId}-${member.userId}`}
                        className="group-page__member-item"
                      >
                        <div className="group-page__avatar">
                          {member.userId.charAt(0).toUpperCase()}
                        </div>
                        <div className="group-page__member-info">
                          <span className="group-page__member-name">
                            {member.userId}
                          </span>
                          <span className="group-page__member-email">
                            {new Date(member.joinedAt).toLocaleString("vi-VN")}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          iconLeft={<IoTrashOutline />}
                          onClick={() =>
                            void handleRemoveMember(
                              group.id,
                              member.userId,
                              member.userId,
                            )
                          }
                        >
                          Xóa
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal thêm thành viên */}
      {addMemberModal && (
        <Modal
          open={true}
          title={`Thêm thành viên vào "${addMemberModal.name}"`}
          size="md"
          onClose={() => setAddMemberModal(null)}
        >
          <div className="group-page__add-modal">
            <input
              className="group-page__add-input"
              placeholder="Tìm theo tên hoặc email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              autoFocus
            />
            <div className="group-page__user-list">
              {filteredUsers.length === 0 ? (
                <p className="group-page__no-member">
                  {userSearch
                    ? "Không tìm thấy người dùng phù hợp"
                    : "Tất cả người dùng đã trong nhóm"}
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} className="group-page__user-item">
                    <div className="group-page__avatar">
                      {user.fullName.charAt(0)}
                    </div>
                    <div className="group-page__member-info">
                      <span className="group-page__member-name">
                        {user.fullName}
                      </span>
                      <span className="group-page__member-email">
                        {user.email}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      iconLeft={<IoPersonAddOutline />}
                      disabled={addingUserId === user.id}
                      onClick={() => void handleAddMember(user.id)}
                    >
                      {addingUserId === user.id ? "Đang thêm..." : "Thêm"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default GroupManagementPage;

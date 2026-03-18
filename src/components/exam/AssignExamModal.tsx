import { useMemo, useState } from "react";
import { IoPeopleOutline, IoPersonOutline } from "react-icons/io5";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Select from "../ui/Select";
import type { AssignmentTarget } from "../../types/assignment";

interface AssignExamModalProps {
  open: boolean;
  targets: AssignmentTarget[];
  assigning?: boolean;
  onClose: () => void;
  onSubmit: (userIds: string[], groupIds: number[]) => void;
}

const AssignExamModal = ({
  open,
  targets,
  assigning = false,
  onClose,
  onSubmit,
}: AssignExamModalProps) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const users = useMemo(
    () => targets.filter((target) => target.type === "user"),
    [targets],
  );
  const groups = useMemo(
    () => targets.filter((target) => target.type === "group"),
    [targets],
  );

  return (
    <Modal
      open={open}
      title="Phân công đề thi"
      description="Chọn học sinh hoặc nhóm/lớp để giao đề theo hình thức nhiều lựa chọn."
      size="lg"
      onClose={onClose}
    >
      <div className="assign-exam-modal">
        <div className="assign-exam-modal__grid">
          <div className="assign-exam-modal__field">
            <div className="assign-exam-modal__label">
              <IoPersonOutline />
              <span>Học sinh</span>
            </div>
            <Select
              multiple
              searchable
              options={users.map((user) => ({
                value: user.id,
                label: user.fullName,
              }))}
              values={selectedUsers}
              onChange={() => undefined}
              onMultiChange={setSelectedUsers}
            />
          </div>

          <div className="assign-exam-modal__field">
            <div className="assign-exam-modal__label">
              <IoPeopleOutline />
              <span>Nhóm / lớp</span>
            </div>
            <Select
              multiple
              searchable
              options={groups.map((group) => ({
                value: group.id,
                label: group.fullName,
              }))}
              values={selectedGroups}
              onChange={() => undefined}
              onMultiChange={(value) => setSelectedGroups(value.map(Number))}
            />
          </div>
        </div>

        <div className="assign-exam-modal__actions">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={() => onSubmit(selectedUsers, selectedGroups)}
            disabled={assigning}
          >
            {assigning ? "Đang phân công..." : "Phân công"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AssignExamModal;

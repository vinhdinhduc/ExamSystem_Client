import { useEffect, useState } from "react";
import {
  IoAddOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoShareOutline,
  IoCloudUploadOutline,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import AssignExamModal from "../../components/exam/AssignExamModal";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import {
  deleteExam,
  fetchExams,
  publishExam,
} from "../../redux/slices/examSlice";
import { fetchAssignmentTargets, assignExam } from "../../redux/slices/assignmentSlice";
import type { RootState } from "../../redux/store";
import type { Exam } from "../../types/exam";
import {
  formatDuration,
  getExamStatusVariant,
  normalizeExamStatus,
} from "../../utils/examUi";

const ExamListPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { exams, loading, error } = useAppSelector(
    (state: RootState) => state.exam,
  );
  const { targets, assigning } = useAppSelector(
    (state: RootState) => state.assignment,
  );

  const [search, setSearch] = useState("");
  const [assignExamItem, setAssignExamItem] = useState<Exam | null>(null);

  useEffect(() => {
    void dispatch(fetchExams());
  }, [dispatch]);

  const filtered = exams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.subjectName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handlePublish = async (id: string) => {
    const result = await dispatch(publishExam(id));
    if (publishExam.fulfilled.match(result))
      toast.success("Đề thi đã xuất bản");
    else toast.error("Không thể xuất bản đề thi");
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Xóa đề thi "${title}"?`)) return;
    const result = await dispatch(deleteExam(id));
    if (deleteExam.fulfilled.match(result)) toast.success("Đã xóa");
    else toast.error("Không thể xóa");
  };

  const openAssignModal = (exam: Exam) => {
    setAssignExamItem(exam);
    void dispatch(fetchAssignmentTargets());
  };

  const handleAssignSubmit = async (userIds: string[], groupIds: number[]) => {
    if (!assignExamItem) return;
    const result = await dispatch(
      assignExam({ examId: assignExamItem.id, userIds, groupIds }),
    );
    if (assignExam.fulfilled.match(result)) {
      toast.success("Đã phân công đề thi");
      setAssignExamItem(null);
    } else {
      toast.error("Không thể phân công đề thi");
    }
  };

  return (
    <div className="exam-list-page">
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">Danh sách đề thi</h1>
          <p className="page-header__subtitle">
            Quản lý toàn bộ đề thi trong hệ thống.
          </p>
        </div>
        <div className="page-header__actions">
          <Button
            iconLeft={<IoAddOutline />}
            onClick={() => navigate("/exams/new")}
          >
            Tạo đề thi
          </Button>
        </div>
      </div>

      <Card>
        <div className="toolbar">
          <input
            className="toolbar__search"
            placeholder="Tìm kiếm đề thi, môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && <LoadingSpinner />}
        {error && <p className="error-text">{error}</p>}

        <Table<Exam>
          data={filtered}
          rowKey={(row) => row.id}
          emptyText="Chưa có đề thi nào."
          columns={[
            {
              key: "title",
              title: "Tên đề thi",
              render: (row) => (
                <div>
                  <strong style={{ fontSize: "0.9rem" }}>{row.title}</strong>
                  {row.description && (
                    <p
                      style={{
                        margin: "0.15rem 0 0",
                        fontSize: "0.78rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      {row.description}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "subject",
              title: "Môn học",
              render: (row) => row.subjectName ?? `ID ${row.subjectId}`,
            },
            {
              key: "totalQuestions",
              title: "Số câu",
              render: (row) => row.totalQuestions,
            },
            {
              key: "duration",
              title: "Thời gian",
              render: (row) => formatDuration(row.duration),
            },
            {
              key: "status",
              title: "Trạng thái",
              render: (row) => (
                <Badge
                  label={normalizeExamStatus(row.status)}
                  variant={getExamStatusVariant(row.status)}
                />
              ),
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (row) => (
                <div
                  style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<IoEyeOutline />}
                    onClick={() => navigate(`/exams/${row.id}/preview`)}
                  >
                    Xem
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<IoCreateOutline />}
                    onClick={() => navigate(`/exams/${row.id}/edit`)}
                  >
                    Sửa
                  </Button>
                  {normalizeExamStatus(row.status) === "Draft" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      iconLeft={<IoCloudUploadOutline />}
                      onClick={() => void handlePublish(row.id)}
                    >
                      Xuất bản
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<IoShareOutline />}
                    onClick={() => openAssignModal(row)}
                  >
                    Giao
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    iconLeft={<IoTrashOutline />}
                    onClick={() => void handleDelete(row.id, row.title)}
                  >
                    Xóa
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {assignExamItem && (
        <AssignExamModal
          open={true}
          targets={targets}
          assigning={assigning}
          onClose={() => setAssignExamItem(null)}
          onSubmit={(userIds, groupIds) => void handleAssignSubmit(userIds, groupIds)}
        />
      )}
    </div>
  );
};

export default ExamListPage;
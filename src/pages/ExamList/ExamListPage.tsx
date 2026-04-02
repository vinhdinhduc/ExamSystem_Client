import { useEffect, useState } from "react";
import {
  IoAddOutline,
  IoEyeOutline,
  IoCreateOutline,
  IoTrashOutline,
  IoShareOutline,
  IoCloudUploadOutline,
  IoPlayCircleOutline,
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
import {
  fetchAssignmentTargets,
  assignExam,
} from "../../redux/slices/assignmentSlice";
import type { RootState } from "../../redux/store";
import type { Exam } from "../../types/exam";
import {
  formatDuration,
  getExamStatusLabel,
  getExamStatusVariant,
  normalizeExamStatus,
} from "../../utils/examUi";
import { canPerformFeature } from "../../utils/roleHelper";

const ExamListPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { exams, loading, error } = useAppSelector(
    (state: RootState) => state.exam,
  );

  console.log("exams", exams);
  const { targets, assigning } = useAppSelector(
    (state: RootState) => state.assignment,
  );
  const { user } = useAppSelector((state: RootState) => state.auth);

  const [search, setSearch] = useState("");
  const [assignExamItem, setAssignExamItem] = useState<Exam | null>(null);

  // Role-based access
  const canCreate = canPerformFeature(user?.roles ?? [], "canCreateExam");
  const canAssign = canPerformFeature(user?.roles ?? [], "canAssignExams");

  useEffect(() => {
    void dispatch(fetchExams());
  }, [dispatch]);

  // Defensive check: ensure exams is an array before filtering
  const validExams = Array.isArray(exams) ? exams : [];
  const filtered = validExams.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.subjectName ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const handlePublish = async (id: string) => {
    if (!user?.id) {
      toast.error(
        "Không xác định được người xuất bản. Vui lòng đăng nhập lại.",
      );
      return;
    }
    const result = await dispatch(
      publishExam({ id, publishedByUserId: user.id }),
    );
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
    const requests = [
      ...userIds.map((userId) =>
        dispatch(
          assignExam({ examId: assignExamItem.id, userId, groupId: null }),
        ),
      ),
      ...groupIds.map((groupId) =>
        dispatch(
          assignExam({ examId: assignExamItem.id, userId: null, groupId }),
        ),
      ),
    ];

    if (requests.length === 0) {
      toast.info("Vui lòng chọn ít nhất 1 học sinh hoặc nhóm");
      return;
    }

    const results = await Promise.all(requests);
    const hasFailure = results.some((result) =>
      assignExam.rejected.match(result),
    );
    if (!hasFailure) {
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
            {canCreate
              ? "Quản lý toàn bộ đề thi trong hệ thống."
              : "Xem các đề thi được giao cho bạn."}
          </p>
        </div>
        {canCreate && (
          <div className="page-header__actions">
            <Button
              iconLeft={<IoAddOutline />}
              onClick={() => navigate("/exams/new")}
            >
              Tạo đề thi
            </Button>
          </div>
        )}
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
                <div className="exam-list-page__title-cell">
                  <strong className="exam-list-page__title-text">
                    {row.title}
                  </strong>
                  {row.description && (
                    <p className="exam-list-page__title-desc">
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
                  label={getExamStatusLabel(row.status)}
                  variant={getExamStatusVariant(row.status)}
                />
              ),
            },
            {
              key: "actions",
              title: "Thao tác",
              render: (row) => (
                <div className="exam-list-page__actions-cell">
                  <Button
                    size="sm"
                    variant="outline"
                    iconLeft={<IoEyeOutline />}
                    onClick={() =>
                      navigate(canCreate ? `/exams/${row.id}/preview` : `/exam/${row.id}`)
                    }
                  >
                    {canCreate ? "Xem trước" : "Chi tiết"}
                  </Button>
                  {!canCreate && normalizeExamStatus(row.status) === "Published" && (
                    <Button
                      size="sm"
                      variant="primary"
                      iconLeft={<IoPlayCircleOutline />}
                      onClick={() => navigate(`/do-exam/${row.id}`)}
                    >
                      Vào thi
                    </Button>
                  )}
                  {canCreate && (
                    <>
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
                      {canAssign && (
                        <Button
                          size="sm"
                          variant="outline"
                          iconLeft={<IoShareOutline />}
                          onClick={() => openAssignModal(row)}
                        >
                          Giao
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="danger"
                        iconLeft={<IoTrashOutline />}
                        onClick={() => void handleDelete(row.id, row.title)}
                      >
                        Xóa
                      </Button>
                    </>
                  )}
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
          onSubmit={(userIds, groupIds) =>
            void handleAssignSubmit(userIds, groupIds)
          }
        />
      )}
    </div>
  );
};

export default ExamListPage;

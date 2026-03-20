import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import { resultService } from "../../api/services/resultService";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Table from "../../components/ui/Table";
import { useAppSelector } from "../../hooks/reduxHooks";
import type { RootState } from "../../redux/store";
import type {
  StudentExamResultItem,
  TeacherAssignedStudentResultItem,
  TeacherAssignedExamResultItem,
} from "../../types/result";
import { formatDateTime } from "../../utils/examUi";

const normalizeRoleName = (role: unknown): string | null => {
  if (typeof role === "string") return role.toLowerCase();
  if (
    role &&
    typeof role === "object" &&
    "name" in role &&
    typeof (role as { name?: unknown }).name === "string"
  ) {
    return (role as { name: string }).name.toLowerCase();
  }
  return null;
};

const ResultsOverviewPage = () => {
  const { user } = useAppSelector((state: RootState) => state.auth);
  const normalizedRoles = useMemo(
    () =>
      ((user?.roles ?? []) as unknown[])
        .map(normalizeRoleName)
        .filter((role): role is string => Boolean(role)),
    [user?.roles],
  );

  const isTeacherOrAdmin =
    normalizedRoles.includes("teacher") || normalizedRoles.includes("admin");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentResults, setStudentResults] = useState<StudentExamResultItem[]>(
    [],
  );

  const [teacherGroups, setTeacherGroups] = useState<
    TeacherAssignedExamResultItem[]
  >([]);
  const [selectedExamId, setSelectedExamId] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isTeacherOrAdmin) {
          const groups = await resultService.getTeacherAssignedResults();
          if (!mounted) return;
          setTeacherGroups(groups);
          if (groups.length > 0) {
            setSelectedExamId((prev) => prev || groups[0].examId);
          }
        } else {
          const resultItems = await resultService.getMyResults();
          if (!mounted) return;
          setStudentResults(resultItems);
        }
      } catch (fetchError) {
        if (!mounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Không thể tải danh sách kết quả",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadInitial();

    return () => {
      mounted = false;
    };
  }, [isTeacherOrAdmin]);

  const selectedTeacherGroup = useMemo(() => {
    if (!isTeacherOrAdmin || teacherGroups.length === 0) return null;
    return (
      teacherGroups.find((item) => item.examId === selectedExamId) ??
      teacherGroups[0]
    );
  }, [isTeacherOrAdmin, selectedExamId, teacherGroups]);

  const summary = useMemo(() => {
    if (!isTeacherOrAdmin || !selectedTeacherGroup) return null;

    return {
      totalAssigned: selectedTeacherGroup.totalAssigned,
      completed: selectedTeacherGroup.totalSubmitted,
      pending: selectedTeacherGroup.totalNotSubmitted,
    };
  }, [isTeacherOrAdmin, selectedTeacherGroup]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="results-overview-page">
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">Kết quả đề thi</h1>
          <p className="page-header__subtitle">
            {isTeacherOrAdmin
              ? "Theo dõi học sinh đã làm hay chưa làm các đề đã giao."
              : "Xem lại lịch sử các bài thi bạn đã nộp."}
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <p className="error-text">{error}</p>
        </Card>
      )}

      {isTeacherOrAdmin ? (
        <Card>
          <div className="results-overview-page__toolbar">
            <label className="ui-form-field">
              <span className="ui-form-field__label">Chọn đề thi</span>
              <select
                className="ui-form-field__control"
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
              >
                {teacherGroups.map((group) => (
                  <option key={group.examId} value={group.examId}>
                    {group.examTitle}
                  </option>
                ))}
              </select>
            </label>

            {summary && (
              <div className="results-overview-page__stats">
                <Badge
                  label={`Đã giao: ${summary.totalAssigned}`}
                  variant="info"
                />
                <Badge
                  label={`Đã làm: ${summary.completed}`}
                  variant="success"
                />
                <Badge
                  label={`Chưa làm: ${summary.pending}`}
                  variant="warning"
                />
              </div>
            )}
          </div>

          <Table<TeacherAssignedStudentResultItem>
            data={selectedTeacherGroup?.students ?? []}
            rowKey={(row) => row.userId}
            emptyText="Chưa có dữ liệu phân công cho đề thi này."
            columns={[
              {
                key: "fullName",
                title: "Học sinh",
                render: (row) => (
                  <div>
                    <strong>{row.fullName}</strong>
                    {row.email && (
                      <p className="results-overview-page__subtext">
                        {row.email}
                      </p>
                    )}
                  </div>
                ),
              },
              {
                key: "attempts",
                title: "Số lần làm",
                render: (row) => row.attempts,
              },
              {
                key: "submittedAt",
                title: "Nộp bài",
                render: (row) =>
                  row.submittedAt
                    ? formatDateTime(row.submittedAt)
                    : "Chưa nộp",
              },
              {
                key: "score",
                title: "Điểm",
                render: (row) => (row.score != null ? `${row.score}%` : "-"),
              },
              {
                key: "status",
                title: "Trạng thái",
                render: (row) =>
                  row.isSubmitted ? (
                    <Badge label="Đã làm" variant="success" />
                  ) : (
                    <Badge label="Chưa làm" variant="warning" />
                  ),
              },
              {
                key: "action",
                title: "Chi tiết",
                render: (row) =>
                  row.sessionId ? (
                    <Link to={`/result/${row.sessionId}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        iconLeft={<IoEyeOutline />}
                      >
                        Xem bài làm
                      </Button>
                    </Link>
                  ) : (
                    <span>-</span>
                  ),
              },
            ]}
          />
        </Card>
      ) : (
        <Card>
          <Table<StudentExamResultItem>
            data={studentResults}
            rowKey={(row) => row.sessionId}
            emptyText="Bạn chưa có bài thi đã nộp."
            columns={[
              { key: "examTitle", title: "Đề thi" },
              {
                key: "submittedAt",
                title: "Thời gian nộp",
                render: (row) => formatDateTime(row.submittedAt),
              },
              {
                key: "score",
                title: "Điểm",
                render: (row) => `${row.score}%`,
              },
              {
                key: "isPassed",
                title: "Kết quả",
                render: (row) =>
                  row.isPassed ? (
                    <Badge label="Đạt" variant="success" />
                  ) : (
                    <Badge label="Chưa đạt" variant="danger" />
                  ),
              },
              {
                key: "attemptNumber",
                title: "Lần thi",
                render: (row) => row.attemptNumber,
              },
              {
                key: "action",
                title: "Chi tiết",
                render: (row) => (
                  <Link to={`/result/${row.sessionId}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      iconLeft={<IoEyeOutline />}
                    >
                      Xem chi tiết
                    </Button>
                  </Link>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
};

export default ResultsOverviewPage;

import { useEffect, useMemo } from "react";
import {
  IoAlarmOutline,
  IoAlbumsOutline,
  IoCheckmarkCircleOutline,
  IoPlayCircleOutline,
  IoSchoolOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchAssignedExams } from "../../redux/slices/examSlice";
import type { RootState } from "../../redux/store";
import {
  formatDateTime,
  formatDuration,
  getAssignmentBucket,
  getExamStatusVariant,
  normalizeExamStatus,
} from "../../utils/examUi";

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { assignedExams, loading } = useAppSelector(
    (state: RootState) => state.exam,
  );
  const { user } = useAppSelector((state: RootState) => state.auth);

  useEffect(() => {
    void dispatch(fetchAssignedExams());
  }, [dispatch]);

  const { upcoming, doing, completed } = useMemo(() => {
    const upcoming = assignedExams.filter(
      (e) => getAssignmentBucket(e) === "upcoming",
    );
    const doing = assignedExams.filter(
      (e) => getAssignmentBucket(e) === "doing",
    );
    const completed = assignedExams.filter(
      (e) => getAssignmentBucket(e) === "completed",
    );
    return { upcoming, doing, completed };
  }, [assignedExams]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="dashboard-page">
      {/* Greeting */}
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">
            Xin chào, {user?.fullName ?? user?.username ?? "Học viên"} 👋
          </h1>
          <p className="page-header__subtitle">
            Đây là bảng điều khiển theo dõi các kỳ thi được giao.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <IoAlbumsOutline />
          </div>
          <div className="stat-card__body">
            <span className="stat-card__label">Tổng đề được giao</span>
            <span className="stat-card__value">{assignedExams.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--orange">
            <IoAlarmOutline />
          </div>
          <div className="stat-card__body">
            <span className="stat-card__label">Sắp diễn ra</span>
            <span className="stat-card__value">{upcoming.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple">
            <IoPlayCircleOutline />
          </div>
          <div className="stat-card__body">
            <span className="stat-card__label">Đang mở</span>
            <span className="stat-card__value">{doing.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green">
            <IoCheckmarkCircleOutline />
          </div>
          <div className="stat-card__body">
            <span className="stat-card__label">Đã hoàn thành</span>
            <span className="stat-card__value">{completed.length}</span>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="dashboard-section">
          <h2 className="dashboard-section__title">
            <IoAlarmOutline /> Sắp diễn ra
          </h2>
          <div className="dashboard-exam-grid">
            {upcoming.map((exam) => (
              <div key={exam.id} className="exam-card">
                <p className="exam-card__subject">
                  {exam.subjectCode ?? exam.subjectName}
                </p>
                <h3 className="exam-card__title">{exam.title}</h3>
                <p className="exam-card__meta">
                  <IoTimeOutline /> {formatDuration(exam.duration)}
                  {" · "}
                  {exam.totalQuestions} câu
                </p>
                <div className="exam-card__footer">
                  <Badge
                    label={normalizeExamStatus(exam.status)}
                    variant={getExamStatusVariant(exam.status)}
                  />
                  <span className="exam-card__time">
                    {formatDateTime(exam.startDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doing */}
      {doing.length > 0 && (
        <div className="dashboard-section">
          <h2 className="dashboard-section__title">
            <IoPlayCircleOutline /> Đang mở thi
          </h2>
          <div className="dashboard-exam-grid">
            {doing.map((exam) => (
              <div key={exam.id} className="exam-card">
                <p className="exam-card__subject">
                  {exam.subjectCode ?? exam.subjectName}
                </p>
                <h3 className="exam-card__title">{exam.title}</h3>
                <p className="exam-card__meta">
                  <IoTimeOutline /> {formatDuration(exam.duration)}
                  {" · "}
                  {exam.totalQuestions} câu
                </p>
                <div className="exam-card__footer">
                  <Badge label="Đang mở" variant="success" />
                  <Link to={`/do-exam/${exam.id}`}>
                    <Button size="sm">Vào thi</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="dashboard-section">
          <h2 className="dashboard-section__title">
            <IoCheckmarkCircleOutline /> Đã hoàn thành
          </h2>
          <div className="dashboard-exam-grid">
            {completed.map((exam) => (
              <div key={exam.id} className="exam-card">
                <p className="exam-card__subject">
                  {exam.subjectCode ?? exam.subjectName}
                </p>
                <h3 className="exam-card__title">{exam.title}</h3>
                <p className="exam-card__meta">
                  {exam.totalQuestions} câu · {formatDuration(exam.duration)}
                </p>
                <div className="exam-card__footer">
                  <Badge
                    label={normalizeExamStatus(exam.status)}
                    variant={getExamStatusVariant(exam.status)}
                  />
                  <Link to={`/exams/${exam.id}`}>
                    <Button size="sm" variant="outline">
                      Chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {assignedExams.length === 0 && !loading && (
        <Card>
          <div className="dashboard-empty">
            <IoSchoolOutline />
            <p>Chưa có đề thi nào được giao cho bạn.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;

import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  IoTimeOutline,
  IoListOutline,
  IoTrophyOutline,
  IoRepeatOutline,
  IoShuffleOutline,
  IoKeyOutline,
  IoCalendarOutline,
  IoPlayCircleOutline,
  IoArrowBackOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
} from "react-icons/io5";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExamById } from "../../redux/slices/examSlice";
import type { RootState } from "../../redux/store";
import {
  formatDateTime,
  formatDuration,
  getExamStatusLabel,
  getExamStatusVariant,
  normalizeExamStatus,
} from "../../utils/examUi";

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="exam-detail__info-row">
    <span className="exam-detail__info-icon">{icon}</span>
    <span className="exam-detail__info-label">{label}</span>
    <span className="exam-detail__info-value">{value}</span>
  </div>
);

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { examDetail, loading, error } = useAppSelector(
    (state: RootState) => state.exam,
  );

  console.log("examDetail", examDetail);

  useEffect(() => {
    if (id) void dispatch(fetchExamById(id));
  }, [dispatch, id]);

  if (loading) return <LoadingSpinner />;

  if (error)
    return (
      <div className="exam-detail__error">
        <p className="error-text">{error}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    );

  if (!examDetail) return null;

  const status = normalizeExamStatus(examDetail.status);
  const statusLabel = getExamStatusLabel(examDetail.status);

  return (
    <div className="exam-detail-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__text">
          <button
            type="button"
            className="exam-detail__back"
            onClick={() => navigate(-1)}
          >
            <IoArrowBackOutline /> Quay lại
          </button>
          <h1 className="page-header__title">{examDetail.title}</h1>
          {examDetail.subjectName && (
            <p className="page-header__subtitle">{examDetail.subjectName}</p>
          )}
        </div>
        <div className="page-header__actions">
          <Badge
            label={statusLabel}
            variant={getExamStatusVariant(examDetail.status)}
          />
          {status === "Published" && (
            <Button
              iconLeft={<IoPlayCircleOutline />}
              onClick={() => navigate(`/do-exam/${examDetail.id}`)}
            >
              Vào thi
            </Button>
          )}
        </div>
      </div>

      <div className="exam-detail__body">
        {/* Thông tin chính */}
        <div className="exam-detail__card">
          <h2 className="exam-detail__section-title">Thông tin đề thi</h2>

          {examDetail.description && (
            <p className="exam-detail__description">{examDetail.description}</p>
          )}

          <div className="exam-detail__info-grid">
            <InfoRow
              icon={<IoTimeOutline />}
              label="Thời gian làm bài"
              value={formatDuration(examDetail.duration)}
            />
            <InfoRow
              icon={<IoListOutline />}
              label="Số câu hỏi"
              value={`${examDetail.totalQuestions} câu`}
            />
            <InfoRow
              icon={<IoTrophyOutline />}
              label="Điểm đạt"
              value={`${examDetail.passScore} điểm`}
            />
            {examDetail.maxAttempts != null && (
              <InfoRow
                icon={<IoRepeatOutline />}
                label="Số lần làm tối đa"
                value={`${examDetail.maxAttempts} lần`}
              />
            )}
            <InfoRow
              icon={<IoShuffleOutline />}
              label="Trộn câu hỏi"
              value={
                examDetail.shuffleQuestions ? (
                  <span className="exam-detail__yes">
                    <IoCheckmarkCircleOutline /> Có
                  </span>
                ) : (
                  <span className="exam-detail__no">
                    <IoCloseCircleOutline /> Không
                  </span>
                )
              }
            />
            <InfoRow
              icon={<IoShuffleOutline />}
              label="Trộn đáp án"
              value={
                examDetail.shuffleAnswers ? (
                  <span className="exam-detail__yes">
                    <IoCheckmarkCircleOutline /> Có
                  </span>
                ) : (
                  <span className="exam-detail__no">
                    <IoCloseCircleOutline /> Không
                  </span>
                )
              }
            />
            {examDetail.accessCode && (
              <InfoRow
                icon={<IoKeyOutline />}
                label="Mã truy cập"
                value={
                  <code className="exam-detail__code">
                    {examDetail.accessCode}
                  </code>
                }
              />
            )}
          </div>
        </div>

        {/* Thời gian */}
        {(examDetail.startDate ?? examDetail.endDate) && (
          <div className="exam-detail__card">
            <h2 className="exam-detail__section-title">Thời gian thi</h2>
            <div className="exam-detail__info-grid">
              {examDetail.startDate && (
                <InfoRow
                  icon={<IoCalendarOutline />}
                  label="Bắt đầu"
                  value={formatDateTime(examDetail.startDate)}
                />
              )}
              {examDetail.endDate && (
                <InfoRow
                  icon={<IoCalendarOutline />}
                  label="Kết thúc"
                  value={formatDateTime(examDetail.endDate)}
                />
              )}
            </div>
          </div>
        )}

        {/* Hướng dẫn */}
        {examDetail.instructions && (
          <div className="exam-detail__card">
            <h2 className="exam-detail__section-title">Hướng dẫn làm bài</h2>
            <p className="exam-detail__instructions">
              {examDetail.instructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetailPage;

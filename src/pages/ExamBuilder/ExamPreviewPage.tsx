import { useEffect } from "react";
import { IoCheckmarkCircleOutline, IoTimeOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import QuestionPreview from "../../components/exam/QuestionPreview";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExamById, publishExam } from "../../redux/slices/examSlice";
import { fetchQuestionsByExamId } from "../../redux/slices/questionSlice";
import type { RootState } from "../../redux/store";
import {
  formatDuration,
  getExamStatusLabel,
  getExamStatusVariant,
  normalizeExamStatus,
} from "../../utils/examUi";

const ExamPreviewPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { examDetail, loading } = useAppSelector(
    (state: RootState) => state.exam,
  );
  const { user } = useAppSelector((state: RootState) => state.auth);
  const { questions } = useAppSelector((state: RootState) => state.question);

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchExamById(id));
    void dispatch(fetchQuestionsByExamId(id));
  }, [dispatch, id]);

  const handlePublish = async () => {
    if (!id || !user?.id) return;
    const result = await dispatch(
      publishExam({ id, publishedByUserId: user.id }),
    );
    if (publishExam.fulfilled.match(result)) {
      toast.success("Đề thi đã được xuất bản");
      navigate("/exams");
    } else {
      toast.error(result.payload ?? "Không thể xuất bản đề thi");
    }
  };

  if (!examDetail) {
    return <p>Không tìm thấy đề thi.</p>;
  }

  return (
    <div className="exam-preview">
      <div className="page-header">
        <div className="page-header__text">
          <h1 className="page-header__title">Xem trước đề thi</h1>
          <p className="page-header__subtitle">
            Kiểm tra lại cấu trúc đề trước khi xuất bản.
          </p>
        </div>
      </div>

      <Card>
        <h2 className="exam-preview__title">{examDetail.title}</h2>
        <div className="exam-preview__meta">
          <Badge
            label={getExamStatusLabel(examDetail.status)}
            variant={getExamStatusVariant(examDetail.status)}
          />
          <span className="exam-preview__stat">
            <IoTimeOutline /> {formatDuration(examDetail.duration)}
          </span>
          <span className="exam-preview__stat">{questions.length} câu hỏi</span>
          <span className="exam-preview__stat">
            Điểm đạt: {examDetail.passScore}%
          </span>
        </div>
        {examDetail.description ? <p>{examDetail.description}</p> : null}
      </Card>

      <Card title="Danh sách câu hỏi">
        <div className="exam-preview__questions">
          {questions.map((question, index) => (
            <QuestionPreview
              key={question.id}
              question={question}
              index={index}
            />
          ))}
        </div>
      </Card>

      <div className="exam-preview__footer">
        <Button variant="outline" onClick={() => navigate(`/exams/${id}/edit`)}>
          Quay lại chỉnh sửa
        </Button>
        <Button
          iconLeft={<IoCheckmarkCircleOutline />}
          onClick={() => void handlePublish()}
          disabled={
            loading || normalizeExamStatus(examDetail.status) === "Published"
          }
        >
          Xuất bản đề thi
        </Button>
      </div>
    </div>
  );
};

export default ExamPreviewPage;

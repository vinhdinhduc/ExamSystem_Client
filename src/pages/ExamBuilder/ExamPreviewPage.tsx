import { useEffect, useMemo } from "react";
import { IoCheckmarkCircleOutline, IoTimeOutline } from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import QuestionPreview from "../../components/exam/QuestionPreview";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExamById, publishExam } from "../../redux/slices/examSlice";
import {
  fetchQuestionBank,
  fetchQuestionsByExamId,
} from "../../redux/slices/questionSlice";
import type { RootState } from "../../redux/store";
import type { Question } from "../../types/question";
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
  const { questions, bank } = useAppSelector(
    (state: RootState) => state.question,
  );

  useEffect(() => {
    if (!id) return;
    void dispatch(fetchExamById(id));
    void dispatch(fetchQuestionsByExamId(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!examDetail?.subjectId) return;
    void dispatch(fetchQuestionBank(examDetail.subjectId));
  }, [dispatch, examDetail?.subjectId]);

  const previewQuestions = useMemo<Question[]>(() => {
    const mapCorrectOptions = (
      sourceQuestion: Question,
      bankQuestion: Question,
    ): Question => {
      const sourceOptions = sourceQuestion.options ?? [];
      const bankOptions = bankQuestion.options ?? [];

      if (sourceOptions.length === 0 || bankOptions.length === 0) {
        return sourceQuestion;
      }

      const bankById = new Map(
        bankOptions.map((option) => [option.id, option]),
      );
      const bankByOrder = new Map(
        bankOptions.map((option, index) => [
          option.orderIndex ?? index,
          option,
        ]),
      );
      const bankByContent = new Map(
        bankOptions.map((option) => [
          option.content.trim().toLowerCase(),
          option,
        ]),
      );

      const mergedOptions = sourceOptions.map((option, index) => {
        const byId = bankById.get(option.id);
        const byOrder = bankByOrder.get(option.orderIndex ?? index);
        const byContent = bankByContent.get(
          option.content.trim().toLowerCase(),
        );
        const matched = byId ?? byOrder ?? byContent;

        return {
          ...option,
          isCorrect: matched?.isCorrect,
        };
      });

      return {
        ...sourceQuestion,
        options: mergedOptions,
        answers: mergedOptions,
      };
    };

    return questions.map((question) => {
      const hasCorrectInQuestion = (question.options ?? []).some(
        (option) => option.isCorrect !== undefined,
      );

      if (hasCorrectInQuestion) return question;

      const bankQuestion =
        bank.find((item) => item.id === question.id) ??
        bank.find((item) => item.id === question.questionId);

      if (!bankQuestion) return question;

      return mapCorrectOptions(question, bankQuestion);
    });
  }, [bank, questions]);

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
          <span className="exam-preview__stat">
            {previewQuestions.length} câu hỏi
          </span>
          <span className="exam-preview__stat">
            Điểm đạt: {examDetail.passScore}%
          </span>
        </div>
        {examDetail.description ? <p>{examDetail.description}</p> : null}
      </Card>

      <Card title="Danh sách câu hỏi">
        <div className="exam-preview__questions">
          {previewQuestions.map((question, index) => (
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

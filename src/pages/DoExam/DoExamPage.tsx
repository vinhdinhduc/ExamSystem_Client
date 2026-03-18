import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  IoArrowBackOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ExamTimer from "../../components/exam/ExamTimer";
import QuestionCard from "../../components/exam/QuestionCard";
import QuestionPalette from "../../components/exam/QuestionPalette";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExamById } from "../../redux/slices/examSlice";
import { fetchQuestionsByExamId } from "../../redux/slices/questionSlice";
import {
  autosaveSession,
  clearSessionState,
  setCurrentQuestion,
  setRemainingTime,
  setSessionAnswer,
  startExamSession,
  submitExamSession,
} from "../../redux/slices/examSessionSlice";
import type { RootState } from "../../redux/store";

const DoExamPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { examDetail } = useAppSelector((state: RootState) => state.exam);
  const { questions, loading: questionsLoading } = useAppSelector(
    (state: RootState) => state.question,
  );
  const { user } = useAppSelector((state: RootState) => state.auth);
  const {
    sessionId,
    answers,
    currentQuestion,
    remainingTime,
    submitting,
    questionOrder,
    questionAnswerOrder,
  } = useAppSelector((state: RootState) => state.examSession);

  const hasAutoSubmitted = useRef(false);
  const autosaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id || !user?.id) return;

    hasAutoSubmitted.current = false;
    void dispatch(fetchExamById(id));
    void dispatch(fetchQuestionsByExamId(id));
    void dispatch(
      startExamSession({ examId: id, userId: user.id, accessCode: null }),
    );

    return () => {
      dispatch(clearSessionState());
    };
  }, [dispatch, id, user?.id]);

  const orderedQuestions = useMemo(() => {
    if (!questions.length) {
      return [];
    }

    const questionMap = new Map(
      questions.map((question) => [question.id, question]),
    );
    const ordered = questionOrder
      .map((questionId) => questionMap.get(questionId))
      .filter((question): question is NonNullable<typeof question> =>
        Boolean(question),
      );

    const sourceQuestions = ordered.length > 0 ? ordered : questions;

    return sourceQuestions.map((question) => {
      const answerOrder = questionAnswerOrder[question.id];
      if (!answerOrder || answerOrder.length === 0) {
        return question;
      }

      const options = [...(question.options ?? question.answers ?? [])];
      options.sort((a, b) => {
        const aIndex = answerOrder.indexOf(a.id);
        const bIndex = answerOrder.indexOf(b.id);
        const resolvedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const resolvedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
        return resolvedA - resolvedB;
      });

      return { ...question, options };
    });
  }, [questionAnswerOrder, questionOrder, questions]);

  const handleSubmit = useCallback(async () => {
    if (!sessionId || hasAutoSubmitted.current) return;

    hasAutoSubmitted.current = true;
    const result = await dispatch(submitExamSession(sessionId));
    if (submitExamSession.fulfilled.match(result)) {
      toast.success("Nộp bài thành công!");
      navigate(`/result/${result.payload.sessionId}`, {
        replace: true,
        state: {
          summary: {
            sessionId: result.payload.sessionId,
            score: result.payload.score,
            isPassed: result.payload.isPassed,
            totalCorrect: result.payload.totalCorrect,
            submittedAt: result.payload.submittedAt,
            status: result.payload.status,
            totalQuestions: orderedQuestions.length,
            examTitle: examDetail?.title,
          },
        },
      });
    } else {
      toast.error("Không thể nộp bài, vui lòng thử lại.");
    }
  }, [
    dispatch,
    examDetail?.title,
    navigate,
    orderedQuestions.length,
    sessionId,
  ]);

  const handleAnswer = (questionId: string, selectedIds: number[]) => {
    dispatch(setSessionAnswer({ questionId, answerIds: selectedIds }));
    if (autosaveDebounce.current) clearTimeout(autosaveDebounce.current);
    autosaveDebounce.current = setTimeout(() => {
      void dispatch(autosaveSession());
    }, 500);
  };

  const answeredMap: Record<number, boolean> = {};
  orderedQuestions.forEach((question, index) => {
    answeredMap[index] = (answers[question.id]?.length ?? 0) > 0;
  });
  const answeredCount = Object.values(answeredMap).filter(Boolean).length;
  const progressPct = orderedQuestions.length
    ? Math.round((answeredCount / orderedQuestions.length) * 100)
    : 0;

  const currentQ = orderedQuestions[currentQuestion] ?? null;

  if (questionsLoading || !sessionId) return <LoadingSpinner />;

  return (
    <div className="do-exam">
      <div className="do-exam__main">
        <div className="do-exam__header">
          <h1 className="do-exam__title">
            {examDetail?.title ?? "Làm bài thi"}
          </h1>
          <ExamTimer
            seconds={remainingTime}
            onTick={(next) => dispatch(setRemainingTime(next))}
            onExpire={() => void handleSubmit()}
          />
        </div>

        {currentQ ? (
          <>
            <QuestionCard
              question={currentQ}
              value={answers[currentQ.id] ?? []}
              onChange={(ids) => handleAnswer(currentQ.id, ids)}
            />
            <div className="do-exam__nav">
              <Button
                variant="outline"
                iconLeft={<IoArrowBackOutline />}
                disabled={currentQuestion === 0}
                onClick={() =>
                  dispatch(setCurrentQuestion(currentQuestion - 1))
                }
              >
                Câu trước
              </Button>
              <span className="do-exam__counter">
                {currentQuestion + 1} / {orderedQuestions.length}
              </span>
              <Button
                iconRight={<IoArrowForwardOutline />}
                disabled={currentQuestion === orderedQuestions.length - 1}
                onClick={() =>
                  dispatch(setCurrentQuestion(currentQuestion + 1))
                }
              >
                Câu tiếp
              </Button>
            </div>
          </>
        ) : (
          <p className="error-text">Không có câu hỏi nào.</p>
        )}
      </div>

      <div className="do-exam__sidebar">
        <QuestionPalette
          total={orderedQuestions.length}
          current={currentQuestion}
          answeredMap={answeredMap}
          onSelect={(idx) => dispatch(setCurrentQuestion(idx))}
        />

        <Card>
          <p className="do-exam__progress">
            Đã trả lời: <strong>{answeredCount}</strong> /{" "}
            {orderedQuestions.length}
          </p>
          <div className="do-exam__progress-bar">
            <div
              className="do-exam__progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="do-exam__submit-wrap">
            <Button
              fullWidth
              iconLeft={<IoCheckmarkCircleOutline />}
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Đang nộp..." : "Nộp bài"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DoExamPage;

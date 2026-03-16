import { useCallback, useEffect, useRef } from "react";
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
  const { sessionId, answers, currentQuestion, remainingTime, submitting } =
    useAppSelector((state: RootState) => state.examSession);

  const hasAutoSubmitted = useRef(false);
  const autosaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bootstrap session on mount
  useEffect(() => {
    if (!id) return;
    hasAutoSubmitted.current = false;
    void dispatch(fetchExamById(id));
    void dispatch(fetchQuestionsByExamId(id));
    void dispatch(startExamSession(id));
    return () => {
      dispatch(clearSessionState());
    };
  }, [dispatch, id]);

  const handleSubmit = useCallback(async () => {
    if (!sessionId || hasAutoSubmitted.current) return;
    hasAutoSubmitted.current = true;
    const result = await dispatch(submitExamSession(sessionId));
    if (submitExamSession.fulfilled.match(result)) {
      toast.success("Nộp bài thành công!");
      navigate(`/result/${result.payload.id}`, { replace: true });
    } else {
      toast.error("Không thể nộp bài, vui lòng thử lại.");
    }
  }, [dispatch, navigate, sessionId]);

  // Debounce autosave 500ms
  const handleAnswer = (questionId: string, selectedIds: number[]) => {
    dispatch(setSessionAnswer({ questionId, answerIds: selectedIds }));
    if (autosaveDebounce.current) clearTimeout(autosaveDebounce.current);
    autosaveDebounce.current = setTimeout(() => {
      void dispatch(autosaveSession());
    }, 500);
  };

  const answeredMap: Record<number, boolean> = {};
  questions.forEach((q, idx) => {
    answeredMap[idx] = (answers[q.id]?.length ?? 0) > 0;
  });
  const answeredCount = Object.values(answeredMap).filter(Boolean).length;
  const progressPct = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  const currentQ = questions[currentQuestion] ?? null;

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
              <span style={{ fontSize: "0.85rem", color: "#61728a" }}>
                {currentQuestion + 1} / {questions.length}
              </span>
              <Button
                iconRight={<IoArrowForwardOutline />}
                disabled={currentQuestion === questions.length - 1}
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
          total={questions.length}
          current={currentQuestion}
          answeredMap={answeredMap}
          onSelect={(idx) => dispatch(setCurrentQuestion(idx))}
        />

        <Card>
          <p className="do-exam__progress">
            Đã trả lời: <strong>{answeredCount}</strong> / {questions.length}
          </p>
          <div className="do-exam__progress-bar">
            <div
              className="do-exam__progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div style={{ marginTop: "0.75rem" }}>
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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/ui/Button";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { fetchExamById } from "../../redux/slices/examSlice";
import {
  fetchQuestionsByExamId,
  resetAnswers,
  selectAnswer,
} from "../../redux/slices/questionSlice";
import { submitExam } from "../../redux/slices/resultSlice";
import type { RootState } from "../../redux/store";
import type { ExamState } from "../../types/exam";
import type { ResultState } from "../../types/result";

const DoExamPage = () => {
  const select = useSelector.withTypes<RootState>();
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const examId = Number(id);
  const { examDetail } = select((state): ExamState => state.exam);
  const { questions, selectedAnswers, loading, error } = select(
    (state) => state.question,
  );
  const { loading: submitting } = select((state): ResultState => state.result);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    if (Number.isNaN(examId)) {
      return;
    }

    hasAutoSubmitted.current = false;

    void dispatch(fetchExamById(examId));
    void dispatch(fetchQuestionsByExamId(examId));
    dispatch(resetAnswers());
  }, [dispatch, examId]);

  const totalDurationSeconds = (examDetail?.durationMinutes ?? 0) * 60;
  const timeLeft = Math.max(totalDurationSeconds - elapsedSeconds, 0);

  const handleSubmit = useCallback(async () => {
    if (!questions.length || Number.isNaN(examId)) {
      return;
    }

    const answers = questions
      .filter((question) => selectedAnswers[question.id] !== undefined)
      .map((question) => ({
        questionId: question.id,
        selectedOptionId: selectedAnswers[question.id],
      }));

    const result = await dispatch(submitExam({ examId, answers }));
    if (submitExam.fulfilled.match(result)) {
      toast.success("Exam submitted successfully");
      dispatch(resetAnswers());
      navigate(`/result/${result.payload.resultId}`, { replace: true });
      return;
    }

    toast.error(result.payload ?? "Unable to submit exam");
  }, [dispatch, examId, navigate, questions, selectedAnswers]);

  useEffect(() => {
    if (!totalDurationSeconds) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((previous) => previous + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [totalDurationSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (questions.length > 0 && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        void handleSubmit();
      }
    }
  }, [handleSubmit, questions.length, timeLeft]);

  const timerText = useMemo(() => {
    const minutes = Math.floor(Math.max(timeLeft, 0) / 60);
    const seconds = Math.max(timeLeft, 0) % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }, [timeLeft]);

  if (loading) {
    return <p>Loading questions...</p>;
  }

  return (
    <section className="exam-page">
      <div className="exam-header">
        <h2>{examDetail?.title ?? "Do Exam"}</h2>
        <span className="timer-chip">Time Left: {timerText}</span>
      </div>

      {error && <p className="error-text">{error}</p>}

      {questions.map((question, index) => (
        <article key={question.id} className="card">
          <h3>
            {index + 1}. {question.content}
          </h3>
          <div className="options-grid">
            {question.options.map((option) => (
              <label key={option.id} className="option-row">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={selectedAnswers[question.id] === option.id}
                  onChange={() =>
                    dispatch(
                      selectAnswer({
                        questionId: question.id,
                        selectedOptionId: option.id,
                      }),
                    )
                  }
                />
                {option.text}
              </label>
            ))}
          </div>
        </article>
      ))}

      <Button onClick={() => void handleSubmit()} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Exam"}
      </Button>
    </section>
  );
};

export default DoExamPage;

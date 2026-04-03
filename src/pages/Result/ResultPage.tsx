import { useEffect, useMemo, useState } from "react";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHomeOutline,
  IoInformationCircleOutline,
  IoListOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import { useLocation, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { examSessionService } from "../../api/services/examSessionService";
import type { ExamSessionReviewResult } from "../../types/examSession";
import type { ResultSummaryView } from "../../types/result";
import KaTeXRenderer from "../../components/math/KaTeXRenderer";

const ResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const [review, setReview] = useState<ExamSessionReviewResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const summary = (location.state as { summary?: ResultSummaryView } | null)
    ?.summary;

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy phiên thi để xem kết quả.");
      return;
    }

    let mounted = true;

    const fetchReview = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await examSessionService.getSessionReview(id);
        console.log("Check revview", result);

        if (!mounted) return;
        setReview(result);
      } catch (fetchError) {
        if (!mounted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Không thể tải chi tiết kết quả bài thi",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchReview();

    return () => {
      mounted = false;
    };
  }, [id]);

  const displaySummary = useMemo<ResultSummaryView | null>(() => {
    if (review) {
      return {
        sessionId: review.sessionId,
        score: review.score,
        isPassed: review.isPassed,
        totalCorrect: review.totalCorrect,
        submittedAt: review.submittedAt,
        status: review.isPassed ? 1 : 0,
        totalQuestions: review.questions.length,
        examTitle: review.examTitle,
      };
    }

    return summary ?? null;
  }, [review, summary]);

  if (!displaySummary && loading) return <LoadingSpinner />;

  if (!displaySummary) {
    return (
      <div className="result-page">
        <p className="error-text">{error ?? "Không tìm thấy kết quả."}</p>

        <div className="result-page__actions">
          <Link to="/dashboard">
            <Button variant="outline" iconLeft={<IoHomeOutline />}>
              Bảng điều khiển
            </Button>
          </Link>
          <Link to="/exams">
            <Button variant="outline" iconLeft={<IoListOutline />}>
              Danh sách đề
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canShowCorrectAnswer = review
    ? review.questions.some((question) =>
        question.options.some((option) => option.isCorrect !== null),
      )
    : false;

  return (
    <div className="result-page">
      <div className="result-score">
        <div
          className={`result-score__circle ${displaySummary.isPassed ? "result-score__circle--pass" : "result-score__circle--fail"}`}
        >
          {displaySummary.score}%
        </div>
        <h1 className="result-score__title">
          {displaySummary.examTitle ?? "Kết quả bài thi"}
        </h1>
        <p className="result-score__subtitle">
          {displaySummary.isPassed
            ? "Chúc mừng! Bạn đã đạt."
            : "Bạn chưa đạt yêu cầu. Hãy cố gắng hơn!"}
        </p>

        <div className="result-score__stats">
          <div className="result-score__stat-item">
            <span className="result-score__stat-value result-score__stat-value--correct">
              {displaySummary.totalCorrect}
            </span>
            <span className="result-score__stat-label">Câu đúng</span>
          </div>
          <div className="result-score__stat-item">
            <span className="result-score__stat-value result-score__stat-value--wrong">
              {Math.max(
                0,
                displaySummary.totalQuestions - displaySummary.totalCorrect,
              )}
            </span>
            <span className="result-score__stat-label">Câu sai</span>
          </div>
          <div className="result-score__stat-item">
            <span className="result-score__stat-value result-score__stat-value--total">
              {displaySummary.totalQuestions}
            </span>
            <span className="result-score__stat-label">Tổng câu</span>
          </div>
        </div>
      </div>

      {error && (
        <Card>
          <p className="error-text">{error}</p>
        </Card>
      )}

      <div className="result-page__actions">
        <Link to="/dashboard">
          <Button variant="outline" iconLeft={<IoHomeOutline />}>
            Bảng điều khiển
          </Button>
        </Link>
        <Link to="/exams">
          <Button variant="outline" iconLeft={<IoListOutline />}>
            Danh sách đề
          </Button>
        </Link>
      </div>

      {review && review.questions.length > 0 && (
        <Card title="Chi tiết đáp án">
          {!canShowCorrectAnswer && (
            <p className="review-note">
              <IoInformationCircleOutline />
              Đáp án đúng đang được ẩn theo cấu hình của đề thi.
            </p>
          )}
          <div className="review-list">
            {review.questions
              .slice()
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((question, index) => (
                <div key={question.questionId} className="review-card">
                  <div className="review-card__header">
                    <p className="review-card__question">
                      {index + 1}.{" "}
                      {/* Render nội dung câu hỏi (có thể chứa công thức) bằng KaTeX */}
                      <KaTeXRenderer
                        latex={question.content}
                        displayMode={false}
                        as="span"
                      />
                    </p>
                    <div
                      className={`review-card__verdict ${question.isCorrect ? "review-card__verdict--correct" : "review-card__verdict--wrong"}`}
                    >
                      {question.isCorrect ? (
                        <>
                          <IoCheckmarkCircle /> Đúng
                        </>
                      ) : (
                        <>
                          <IoCloseCircle /> Sai
                        </>
                      )}
                    </div>
                  </div>

                  <div className="review-card__options">
                    {question.options
                      .slice()
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((option) => {
                        const classes = ["review-option"];

                        if (option.isSelected) {
                          classes.push("review-option--selected");
                        }

                        if (option.isCorrect === true) {
                          classes.push("review-option--correct");
                        }

                        if (option.isSelected && option.isCorrect === false) {
                          classes.push("review-option--wrong-selected");
                        }

                        return (
                          <div key={option.id} className={classes.join(" ")}>
                            <span className="review-option__label">
                              {/* Render nội dung đáp án bằng KaTeX */}
                              <KaTeXRenderer
                                latex={option.content}
                                displayMode={false}
                                as="span"
                              />
                            </span>
                            <span className="review-option__meta">
                              {option.isSelected ? "Bạn chọn" : ""}
                              {option.isSelected && option.isCorrect === true
                                ? " • "
                                : ""}
                              {option.isCorrect === true ? "Đáp án đúng" : ""}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {!canShowCorrectAnswer && (
                    <div className="review-card__answer-row">
                      <span className="review-card__label">Bạn chọn:</span>
                      <span className="review-card__value">
                        {question.selectedAnswerIds.length
                          ? question.selectedAnswerIds.join(", ")
                          : "Chưa trả lời"}
                      </span>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="review-card__explanation">
                      {/* Render giải thích bằng KaTeX */}
                      <KaTeXRenderer
                        latex={question.explanation}
                        displayMode={false}
                        as="span"
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}

      {review && review.questions.length === 0 && (
        <Card>
          <p className="review-note">
            Bài làm không có dữ liệu câu hỏi để xem lại.
          </p>
        </Card>
      )}

      {loading && displaySummary && (
        <Card>
          <p className="review-note">Đang tải chi tiết bài làm...</p>
        </Card>
      )}
    </div>
  );
};

export default ResultPage;

import { useEffect } from "react";
import {
  IoCheckmarkCircle,
  IoCloseCircle,
  IoHomeOutline,
  IoListOutline,
} from "react-icons/io5";
import { Link } from "react-router-dom";
import { useLocation, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchResultById } from "../../redux/slices/resultSlice";
import type { RootState } from "../../redux/store";
import type { ResultSummaryView } from "../../types/result";

const ResultPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentResult, loading, error } = useAppSelector(
    (state: RootState) => state.result,
  );
  const summary = (location.state as { summary?: ResultSummaryView } | null)
    ?.summary;

  useEffect(() => {
    if (!id || summary) return;
    void dispatch(fetchResultById(id));
  }, [dispatch, id, summary]);

  if (!summary && loading) return <LoadingSpinner />;
  if (!summary && error) return <p className="error-text">{error}</p>;

  if (summary) {
    return (
      <div className="result-page">
        <div className="result-score">
          <div
            className={`result-score__circle ${summary.isPassed ? "result-score__circle--pass" : "result-score__circle--fail"}`}
          >
            {summary.score}%
          </div>
          <h1 className="result-score__title">
            {summary.examTitle ?? "Kết quả bài thi"}
          </h1>
          <p className="result-score__subtitle">
            {summary.isPassed
              ? "Chúc mừng! Bạn đã đạt."
              : "Bạn chưa đạt yêu cầu. Hãy cố gắng hơn!"}
          </p>

          <div className="result-score__stats">
            <div className="result-score__stat-item">
              <span className="result-score__stat-value result-score__stat-value--correct">
                {summary.totalCorrect}
              </span>
              <span className="result-score__stat-label">Câu đúng</span>
            </div>
            <div className="result-score__stat-item">
              <span className="result-score__stat-value result-score__stat-value--wrong">
                {Math.max(0, summary.totalQuestions - summary.totalCorrect)}
              </span>
              <span className="result-score__stat-label">Câu sai</span>
            </div>
            <div className="result-score__stat-item">
              <span className="result-score__stat-value result-score__stat-value--total">
                {summary.totalQuestions}
              </span>
              <span className="result-score__stat-label">Tổng câu</span>
            </div>
          </div>
        </div>

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

  if (!currentResult) {
    return (
      <div className="result-page">
        <p>Không tìm thấy kết quả.</p>
        <Link to="/dashboard">
          <Button variant="outline" iconLeft={<IoHomeOutline />}>
            Về bảng điều khiển
          </Button>
        </Link>
      </div>
    );
  }

  const isPassed = currentResult.score >= 50;

  return (
    <div className="result-page">
      {/* Score summary */}
      <div className="result-score">
        <div
          className={`result-score__circle ${isPassed ? "result-score__circle--pass" : "result-score__circle--fail"}`}
        >
          {currentResult.score}%
        </div>
        <h1 className="result-score__title">
          {currentResult.examTitle ?? "Kết quả bài thi"}
        </h1>
        <p className="result-score__subtitle">
          {isPassed
            ? "Chúc mừng! Bạn đã đạt."
            : "Bạn chưa đạt yêu cầu. Hãy cố gắng hơn!"}
        </p>

        <div className="result-score__stats">
          <div className="result-score__stat-item">
            <span className="result-score__stat-value result-score__stat-value--correct">
              {currentResult.correctAnswers}
            </span>
            <span className="result-score__stat-label">Câu đúng</span>
          </div>
          <div className="result-score__stat-item">
            <span className="result-score__stat-value result-score__stat-value--wrong">
              {currentResult.wrongAnswers}
            </span>
            <span className="result-score__stat-label">Câu sai</span>
          </div>
          <div className="result-score__stat-item">
            <span className="result-score__stat-value result-score__stat-value--total">
              {currentResult.totalQuestions}
            </span>
            <span className="result-score__stat-label">Tổng câu</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
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

      {/* Question review */}
      {currentResult.showCorrectAnswer && currentResult.reviews.length > 0 && (
        <Card title="Chi tiết đáp án">
          <div className="review-list">
            {currentResult.reviews.map((review, index) => (
              <div key={review.questionId} className="review-card">
                <p className="review-card__question">
                  {index + 1}. {review.questionContent}
                </p>

                <div className="review-card__answer-row">
                  <span className="review-card__label">Bạn chọn:</span>
                  <span className="review-card__value">
                    {review.selectedOptionIds.length
                      ? review.selectedOptionIds.join(", ")
                      : "Chưa trả lời"}
                  </span>
                </div>

                <div className="review-card__answer-row">
                  <span className="review-card__label">Đáp án đúng:</span>
                  <span className="review-card__value">
                    {review.correctOptionIds.join(", ")}
                  </span>
                </div>

                <div
                  className={`review-card__verdict ${review.isCorrect ? "review-card__verdict--correct" : "review-card__verdict--wrong"}`}
                >
                  {review.isCorrect ? (
                    <>
                      <IoCheckmarkCircle /> Đúng
                    </>
                  ) : (
                    <>
                      <IoCloseCircle /> Sai
                    </>
                  )}
                </div>

                {review.explanation && (
                  <div className="review-card__explanation">
                    💡 {review.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ResultPage;

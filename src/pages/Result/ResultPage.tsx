import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAppDispatch } from "../../hooks/reduxHooks";
import { fetchResultById } from "../../redux/slices/resultSlice";
import type { RootState } from "../../redux/store";
import type { ResultState } from "../../types/result";

const ResultPage = () => {
  const select = useSelector.withTypes<RootState>();
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const { currentResult, loading, error } = select(
    (state): ResultState => state.result,
  );

  useEffect(() => {
    const resultId = Number(id);
    if (Number.isNaN(resultId)) {
      return;
    }

    void dispatch(fetchResultById(resultId));
  }, [dispatch, id]);

  return (
    <section className="result-page">
      <h2>Result</h2>

      {loading && <p>Loading result...</p>}
      {error && <p className="error-text">{error}</p>}

      {currentResult && (
        <>
          <article className="card">
            <h3>Score: {currentResult.score}</h3>
            <p>
              Correct Answers: {currentResult.correctAnswers}/
              {currentResult.totalQuestions}
            </p>
          </article>

          <div className="review-list">
            {currentResult.reviews.map((review) => (
              <article className="card" key={review.questionId}>
                <h4>{review.questionContent}</h4>
                <p>Selected: {review.selectedOptionId ?? "No answer"}</p>
                <p>Correct: {review.correctOptionId}</p>
                <p className={review.isCorrect ? "ok-text" : "error-text"}>
                  {review.isCorrect ? "Correct" : "Incorrect"}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ResultPage;

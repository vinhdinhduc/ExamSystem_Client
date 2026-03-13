import { useEffect } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExams } from "../../redux/slices/examSlice";
import type { RootState } from "../../redux/store";

const ExamListPage = () => {
  const dispatch = useAppDispatch();
  const { exams, loading, error } = useAppSelector(
    (state: RootState) => state.exam,
  );

  useEffect(() => {
    void dispatch(fetchExams());
  }, [dispatch]);

  return (
    <section className="exam-page">
      <h2>Exam List</h2>
      {loading && <LoadingSpinner />}
      {error && <p className="error-text">{error}</p>}

      <div className="card-grid">
        {exams.map((exam) => (
          <article key={exam.id} className="card">
            <h3>{exam.title}</h3>
            <p>{exam.description}</p>
            <p>
              Duration: {exam.durationMinutes} min | Questions:{" "}
              {exam.totalQuestions}
            </p>
            <Link to={`/exam/${exam.id}`}>View Details</Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ExamListPage;

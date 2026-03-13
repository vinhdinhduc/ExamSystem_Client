import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import { useAppDispatch, useAppSelector } from "../../hooks/reduxHooks";
import { fetchExamById } from "../../redux/slices/examSlice";
import type { RootState } from "../../redux/store";

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { examDetail, loading, error } = useAppSelector(
    (state: RootState) => state.exam,
  );

  useEffect(() => {
    const examId = Number(id);
    if (Number.isNaN(examId)) {
      return;
    }

    void dispatch(fetchExamById(examId));
  }, [dispatch, id]);

  return (
    <section className="exam-page">
      <h2>Exam Detail</h2>
      {loading && <p>Loading exam details...</p>}
      {error && <p className="error-text">{error}</p>}

      {examDetail && (
        <article className="card">
          <h3>{examDetail.title}</h3>
          <p>{examDetail.description}</p>
          <p>Duration: {examDetail.durationMinutes} minutes</p>
          <p>Total Questions: {examDetail.totalQuestions}</p>
          <Button onClick={() => navigate(`/do-exam/${examDetail.id}`)}>
            Start Exam
          </Button>
        </article>
      )}
    </section>
  );
};

export default ExamDetailPage;

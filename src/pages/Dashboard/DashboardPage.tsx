import { Link } from "react-router-dom";

const DashboardPage = () => {
  return (
    <section className="dashboard-page">
      <h2>Dashboard</h2>
      <p>Welcome to the Online Multiple Choice Exam System.</p>
      <div className="card-grid">
        <article className="card">
          <h3>Available Exams</h3>
          <p>View and start an exam from the exam catalog.</p>
          <Link to="/exams">Go to Exams</Link>
        </article>
      </div>
    </section>
  );
};

export default DashboardPage;

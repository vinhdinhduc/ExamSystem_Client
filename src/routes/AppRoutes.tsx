import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import { useAppDispatch } from "../hooks/reduxHooks";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import DoExamPage from "../pages/DoExam/DoExamPage";
import ExamDetailPage from "../pages/ExamDetail/ExamDetailPage";
import ExamListPage from "../pages/ExamList/ExamListPage";
import LoginPage from "../pages/Login/LoginPage";
import ResultPage from "../pages/Result/ResultPage";
import { logout } from "../redux/slices/authSlice";
import { AUTH_LOGOUT_EVENT } from "../utils/authEvents";
import SubjectManagementPage from "../pages/SubjectManagement/SubjectManagementPage";
import ExamBuilderPage from "../pages/ExamBuilder/ExamBuilderPage";
import ExamPreviewPage from "../pages/ExamBuilder/ExamPreviewPage";
import GroupManagementPage from "../pages/GroupManagement/GroupManagementPage";

const DoExamRouteElement = () => {
  const { id } = useParams();
  return <DoExamPage key={id} />;
};

const AppRoutes = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAutoLogout = () => {
      dispatch(logout());
      navigate("/login", { replace: true });
    };

    window.addEventListener(AUTH_LOGOUT_EVENT, handleAutoLogout);
    return () =>
      window.removeEventListener(AUTH_LOGOUT_EVENT, handleAutoLogout);
  }, [dispatch, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* <Route element={<ProtectedRoute />}> */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/exams" element={<ExamListPage />} />
        <Route path="/exam/:id" element={<ExamDetailPage />} />
        <Route path="/do-exam/:id" element={<DoExamRouteElement />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/subjects" element={<SubjectManagementPage />} />
        <Route path="/exams/new" element={<ExamBuilderPage />} />
        <Route path="/exams/:id/edit" element={<ExamBuilderPage />} />
        <Route path="/exams/:id/preview" element={<ExamPreviewPage />} />
        <Route path="/groups" element={<GroupManagementPage />} />
      </Route>
      {/* </Route> */}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;

import { useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { useAppDispatch } from "../hooks/reduxHooks";
import DashboardPage from "../pages/Dashboard/DashboardPage";
import DoExamPage from "../pages/DoExam/DoExamPage";
import ExamDetailPage from "../pages/ExamDetail/ExamDetailPage";
import ExamListPage from "../pages/ExamList/ExamListPage";
import LoginPage from "../pages/Login/LoginPage";
import RegisterPage from "../pages/Register/RegisterPage";
import VerifyEmailPage from "../pages/VerifyEmail/VerifyEmailPage";
import ForgotPasswordPage from "../pages/ForgotPassword/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPassword/ResetPasswordPage";
import ResultPage from "../pages/Result/ResultPage";
import ResultsOverviewPage from "../pages/Result/ResultsOverviewPage";
import { logout } from "../redux/slices/authSlice";
import { AUTH_LOGOUT_EVENT } from "../utils/authEvents";
import SubjectManagementPage from "../pages/SubjectManagement/SubjectManagementPage";
import ExamBuilderPage from "../pages/ExamBuilder/ExamBuilderPage";
import ExamPreviewPage from "../pages/ExamBuilder/ExamPreviewPage";
import GroupManagementPage from "../pages/GroupManagement/GroupManagementPage";
import QuestionManagementPage from "../pages/QuestionManagement/QuestionManagementPage";
import RolesPermissionsPage from "../pages/Admin/RolesPermissionsPage";
import UserManagementPage from "../pages/UserManagement/UserManagementPage";
import ProfilePage from "../pages/Profile/ProfilePage";
import ExamPauseApprovalsPage from "../pages/ExamPause/ExamPauseApprovalsPage";
import ProtectedRoute from "../components/common/ProtectedRoute";

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
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Routes yêu cầu đăng nhập */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exams" element={<ExamListPage />} />
          <Route path="/exam/:id" element={<ExamDetailPage />} />
          <Route path="/do-exam/:id" element={<DoExamRouteElement />} />
          <Route path="/results" element={<ResultsOverviewPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route
            element={<ProtectedRoute allowedRoles={["admin", "teacher"]} />}
          >
            <Route path="/subjects" element={<SubjectManagementPage />} />
            <Route path="/exams/new" element={<ExamBuilderPage />} />
            <Route path="/exams/:id/edit" element={<ExamBuilderPage />} />
            <Route path="/exams/:id/preview" element={<ExamPreviewPage />} />
            <Route path="/questions" element={<QuestionManagementPage />} />
            <Route path="/groups" element={<GroupManagementPage />} />
            <Route path="/exam-pauses" element={<ExamPauseApprovalsPage />} />
          </Route>
        </Route>
      </Route>

      {/* Routes chỉ admin */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="/admin/roles" element={<RolesPermissionsPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;

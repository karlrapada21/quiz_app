import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import TeacherLayout from "./components/TeacherLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import Quizzes from "./pages/Quizzes";
import UnifiedQuiz from "./Quizzes_List/UnifiedQuiz";
import TeacherUsers from "./pages/TeacherUsers";
import TeacherUserQuizzes from "./pages/TeacherUserQuizzes";
import ForgotPassword from "./pages/ForgotPassword";
import TeacherForgotPassword from "./pages/TeacherForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TeacherEdit from "./pages/TeacherEdit";
import ProtectedRoute from "./components/ProtectedRoute";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherEditProfile from "./pages/TeacherEditProfile";

function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgotpassword" element={<ForgotPassword />} />
      <Route path="/resetpassword" element={<ResetPassword />} />
      <Route path="/teacherforgotpassword" element={<TeacherForgotPassword />} />

      {/* Student / normal user layout (protected) */}
      <Route element={<Layout />}>
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute>
              <Quizzes />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Teacher area - all teacher routes protected with teacherOnly */}
      <Route element={<TeacherLayout />}>
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute teacherOnly>
              <TeacherProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/editprofile/:id"
          element={
            <ProtectedRoute teacherOnly>
              <TeacherEditProfile />
            </ProtectedRoute>
          }
        />
          <Route
          path="/teacher/register"
          element={
            <ProtectedRoute teacherOnly>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/teacherusers"
          element={
            <ProtectedRoute teacherOnly>
              <TeacherUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/user/:userId/quizzes"
          element={
            <ProtectedRoute teacherOnly>
              <TeacherUserQuizzes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/edit/:userId"
          element={
            <ProtectedRoute teacherOnly>
              <TeacherEdit />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Individual quiz routes (protected for authenticated users) */}
      <Route
        path="/quiz/:quizName"
        element={
          <ProtectedRoute>
            <UnifiedQuiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/identification"
        element={<Navigate to="/quiz/identification" replace />}
      />
      <Route
        path="/checkbox_quiz"
        element={<Navigate to="/quiz/checkbox" replace />}
      />
      <Route
        path="/open_ended"
        element={<Navigate to="/quiz/open_ended" replace />}
      />


      {/* Default route => login */}
      <Route path="/" element={<Login />} />
    </Routes>
  );
}

export default App;
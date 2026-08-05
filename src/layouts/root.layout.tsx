import AuthRoutes from "@/router/auth.router";
import DashboardLayout from "@/layouts/dashboard.layout";
import CourseEditorPage from "@/modules/course/courseEditor";
import CourseManagementPage from "@/modules/course/courseManagement";
import PdfCourseManagementPage from "@/modules/pdf-course/pdfCourseManagement";
import DashboardPage from "@/modules/dashboard/dashboard";
import ProtectedRoute from "@/router/protected.router";
import RedirectToDashboard from "@/utils/lib/redirectToDashboard";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function RootLayout() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="courses" element={<Navigate replace to="/course" />} />
          </Route>
          <Route path="/course" element={<DashboardLayout />}>
            <Route index element={<CourseManagementPage />} />
            <Route path="add" element={<CourseEditorPage />} />
            <Route path="edit" element={<CourseEditorPage />} />
          </Route>
          <Route path="/pdf-courses" element={<DashboardLayout />}>
            <Route index element={<PdfCourseManagementPage />} />
          </Route>
        </Route>
        <Route path="*" element={<RedirectToDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RootLayout;

import AuthRoutes from "@/router/auth.router";
import AffiliateProductManagementPage from "@/modules/affiliate-product/affiliateProductManagement";
import InstagramFeedbackManagementPage from "@/modules/instagram-feedback/instagramFeedbackManagement";
import DashboardLayout from "@/layouts/dashboard.layout";
import AddCoursePage from "@/modules/course/add-course/add-course-page";
import CourseManagementPage from "@/modules/course/courseManagement";
import CourseAnalyticsPage from "@/modules/course/courseAnalyticsPage";
import PdfCourseManagementPage from "@/modules/pdf-course/pdfCourseManagement";
import DashboardPage from "@/modules/dashboard/dashboard";
import ResetPasswordPage from "@/modules/auth/resetPassword";
import PageMetadata from "@/components/page-metadata.component";
import ProtectedRoute from "@/router/protected.router";
import RedirectToDashboard from "@/utils/lib/redirectToDashboard";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function RootLayout() {
  return (
    <BrowserRouter>
      <PageMetadata />
      <Routes>
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="courses" element={<Navigate replace to="/course" />} />
          </Route>
          <Route path="/course" element={<DashboardLayout />}>
            <Route index element={<CourseManagementPage />} />
            <Route path="analytics/:courseId" element={<CourseAnalyticsPage />} />
            <Route path="add" element={<AddCoursePage />} />
            <Route path="edit" element={<AddCoursePage />} />
          </Route>
          <Route path="/pdf-courses" element={<DashboardLayout />}>
            <Route index element={<PdfCourseManagementPage />} />
          </Route>
          <Route path="/affiliate-products" element={<DashboardLayout />}>
            <Route index element={<AffiliateProductManagementPage />} />
          </Route>
          <Route path="/instagram-feedback" element={<DashboardLayout />}>
            <Route index element={<InstagramFeedbackManagementPage />} />
          </Route>
        </Route>
        <Route path="*" element={<RedirectToDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RootLayout;

import AuthRoutes from "@/router/auth.router";
import RedirectToDashboard from "@/utils/lib/redirectToDashboard";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function RootLayout() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/*" element={<AuthRoutes />} />
        <Route path="*" element={<RedirectToDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default RootLayout;

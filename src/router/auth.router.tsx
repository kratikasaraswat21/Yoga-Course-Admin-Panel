import authPageBackground from "@/assets/auth-page-bg.png";
import { APP_AUTH_ROUTES_MODULE_ARRAY } from "@/modules/auth";
import { getDataFromSecureCookie } from "@/utils/helper/helper";
import RedirectToDashboard from "@/utils/lib/redirectToDashboard";
import { Navigate, Route, Routes } from "react-router-dom";

function AuthRoutes() {
  if (getDataFromSecureCookie("authenticationToken")) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cover bg-center px-4 py-8 sm:px-6 lg:justify-end lg:px-16"
      style={{ backgroundImage: `url(${authPageBackground})` }}>
      <div className="absolute inset-0 bg-slate-950/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/35 via-transparent to-slate-950/25" />
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <Routes>
          {APP_AUTH_ROUTES_MODULE_ARRAY?.map((item) => (
            <Route key={item?.label} path={item?.path} element={item?.module} />
          ))}
          <Route path="*" element={<RedirectToDashboard />} />
        </Routes>
      </div>
    </main>
  );
}

export default AuthRoutes;

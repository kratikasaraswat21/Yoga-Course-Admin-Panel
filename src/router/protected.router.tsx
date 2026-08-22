import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getDataFromSecureCookie } from "@/utils/helper/helper";

function ProtectedRoute() {
  const location = useLocation();
  const yoga_platform_auth_token = getDataFromSecureCookie("yoga_platform_auth_token");

  if (!yoga_platform_auth_token) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth/login" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

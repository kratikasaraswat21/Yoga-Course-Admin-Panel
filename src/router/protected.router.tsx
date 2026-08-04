import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getDataFromSecureCookie } from "@/utils/helper/helper";

function ProtectedRoute() {
  const location = useLocation();
  const authenticationToken = getDataFromSecureCookie("authenticationToken");

  if (!authenticationToken) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth/login" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

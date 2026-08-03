import { clearLocalSessionStorage, getDataFromSecureCookie } from "@/utils/helper/helper";
import { Navigate } from "react-router-dom";

const RedirectToDashboard = () => {
  const tokenValue = getDataFromSecureCookie("authenticationToken");

  if (tokenValue) {
    return <Navigate to="/dashboard" replace />;
  } else {
    clearLocalSessionStorage();
    return <Navigate to="/auth/login" replace />;
  }
};

export default RedirectToDashboard;

import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import DashboardNavbar from "@/components/dashboard/navbar.component";
import DashboardSidebar from "@/components/dashboard/sidebar.component";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { clearLocalSessionStorage, getDataFromSecureCookie } from "@/utils/helper/helper";
import { LoaderCircle } from "lucide-react";

function DashboardLayout() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchUserStatus = useDebounce(async () => {
    try {
      const token = getDataFromSecureCookie("yoga_platform_auth_token");
      if (!token) {
        toast.add({
          title: ERROR_MESSAGES.SESSION_EXPIRED_TITLE,
          description: ERROR_MESSAGES.SESSION_EXPIRED_DESCRIPTION,
          type: "error",
        });
        clearLocalSessionStorage();
        navigate("/auth/login", { replace: true });
        return;
      }
      const response = await multipleApiHandler([{ endPoint: "auth/verify/me", protected: true, method: "GET" }]);

      const res = response[0];
      if (!res?.data?.success) {
        clearLocalSessionStorage();
        toast.add({
          title: ERROR_MESSAGES.SESSION_EXPIRED_TITLE,
          description: res?.data?.message ?? ERROR_MESSAGES.SESSION_EXPIRED_DESCRIPTION,
          type: "error",
        });
        navigate("/auth/login", { replace: true });
        return;
      }

      setIsCheckingAuth(false);
    } catch {
      clearLocalSessionStorage();
      toast.add({
        title: ERROR_MESSAGES.SESSION_VERIFY_TITLE,
        description: ERROR_MESSAGES.SESSION_VERIFY_DESCRIPTION,
        type: "error",
      });
      navigate("/auth/login", { replace: true });
    }
  }, 100);

  useEffect(() => {
    fetchUserStatus();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-slate-100 text-slate-950">
        <div className="flex flex-col items-center gap-3 text-center">
          <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-slate-700" />
          <p className="text-sm font-medium text-slate-600">{SUCCESS_MESSAGES.LOADING_DASHBOARD}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh items-stretch w-full max-w-full overflow-hidden bg-slate-100 text-slate-950">
      <DashboardSidebar
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />

      <div className="flex  min-h-0 min-w-0 flex-col overflow-hidden w-full">
        <DashboardNavbar onOpenSidebar={openSidebar} />

        <main className="dashboard-scroll-area min-h-0 min-w-0 h-full overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

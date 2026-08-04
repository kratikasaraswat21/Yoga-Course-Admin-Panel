import { useState } from "react";
import { Outlet } from "react-router-dom";

import DashboardNavbar from "@/components/dashboard/navbar.component";
import DashboardSidebar from "@/components/dashboard/sidebar.component";

function DashboardLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarExpanded((isExpanded) => !isExpanded);
  };

  return (
    <div className="flex h-dvh items-stretch w-full max-w-full overflow-hidden bg-slate-100 text-slate-950">
      <DashboardSidebar isExpanded={isSidebarExpanded} onToggle={toggleSidebar} />

      <div className="flex  min-h-0 min-w-0 flex-col overflow-hidden w-full">
        <DashboardNavbar />

        <main className="dashboard-scroll-area min-h-0 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

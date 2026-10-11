import { ChevronRight, LogOut, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { DASHBOARD_NAVIGATION_ITEMS } from "@/utils/constants/dashboard.constants";
import { clearLocalSessionStorage, cn } from "@/utils/helper/helper";

interface DashboardSidebarProps {
  isCollapsed: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

function DashboardSidebar({ isCollapsed, isOpen, onClose, onToggleCollapse }: DashboardSidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearLocalSessionStorage();
    onClose();
    setTimeout(() => {
      navigate("/auth/login", { replace: true });
    }, 100);
  };

  return (
    <>
      <button
        aria-label="Close navigation"
        className={cn(
          "fixed inset-0 z-30 bg-slate-950/30 transition-opacity xl:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        type="button"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-300 xl:relative xl:inset-auto xl:z-20 xl:translate-x-0",
          isCollapsed ? "xl:w-20" : "xl:w-64",
          isOpen && "translate-x-0",
        )}>
        <div
          className={cn(
            "flex h-18 items-center border-b border-slate-200 px-4",
            isCollapsed && "xl:justify-center xl:px-3",
          )}>
          <div className={cn("flex min-w-0 items-center gap-3 overflow-hidden", isCollapsed && "xl:justify-center")}>
            <div className="flex size-10">
              <img alt="Kratika Yoga" className="size-full object-contain" src={logo} />
            </div>
            <div className={cn("min-w-0 whitespace-nowrap", isCollapsed && "xl:hidden")}>
              <p className="truncate font-serif text-base font-semibold text-slate-950">Kratika Yoga</p>
              <p className="truncate text-xs text-slate-500">Admin Panel</p>
            </div>
            <Button
              aria-label="Close navigation"
              className="ml-auto xl:hidden"
              onClick={onClose}
              size="icon"
              type="button"
              variant="ghost">
              <X />
            </Button>
          </div>
        </div>

        <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 p-3">
          {DASHBOARD_NAVIGATION_ITEMS.map(({ icon: NavigationIcon, label, path }) => (
            <NavLink
              className={({ isActive }) =>
                cn(
                  "flex h-11 items-center rounded-lg text-sm font-medium transition-colors",
                  isCollapsed ? "justify-center px-3 xl:px-0" : "gap-3 px-3",
                  isActive ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                )
              }
              end={path === "/dashboard"}
              key={path}
              onClick={onClose}
              to={path}>
              <NavigationIcon aria-hidden="true" className="size-5 shrink-0" />
              <span className={cn("truncate", isCollapsed && "xl:hidden")}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <Button
            aria-label="Log out"
            className={cn("mb-1 h-11 w-full gap-3 px-3", isCollapsed ? "justify-center xl:px-0" : "justify-start")}
            onClick={handleLogout}
            title="Log out"
            type="button"
            variant="ghost">
            <LogOut aria-hidden="true" />
            <span className={cn(isCollapsed && "xl:hidden")}>Log out</span>
          </Button>
          <Button
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn("h-11 w-full gap-3 px-3", isCollapsed ? "justify-center xl:px-0" : "justify-start")}
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            type="button"
            variant="ghost">
            <ChevronRight aria-hidden="true" className={cn("transition-transform", !isCollapsed && "rotate-180")} />
            <span className={cn(isCollapsed && "xl:hidden")}>{isCollapsed ? "Open sidebar" : "Close sidebar"}</span>
          </Button>
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;

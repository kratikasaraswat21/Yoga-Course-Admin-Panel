import { ChevronLeft, ChevronRight, Leaf } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { DASHBOARD_NAVIGATION_ITEMS } from "@/utils/constants/dashboard.constants";
import { cn } from "@/utils/helper/helper";

interface DashboardSidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

function DashboardSidebar({ isExpanded, onToggle }: DashboardSidebarProps) {
  return (
    <aside
      className={cn(
        "relative z-20 flex shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-300",
        isExpanded ? "w-64" : "w-20",
      )}>
      <div className="flex h-18 items-center border-b border-slate-200 px-4">
        <div className="flex min-w-0 items-center gap-3 overflow-hidden">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Leaf aria-hidden="true" className="size-5" />
          </div>
          {isExpanded && (
            <div className="min-w-0 whitespace-nowrap">
              <p className="truncate text-sm font-semibold">Yoga Platform</p>
              <p className="truncate text-xs text-slate-500">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 p-3">
        {DASHBOARD_NAVIGATION_ITEMS.map(({ icon: NavigationIcon, label, path }) => (
          <NavLink
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center rounded-lg text-sm font-medium transition-colors",
                isExpanded ? "gap-3 px-3" : "justify-center px-0",
                isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )
            }
            end={path === "/dashboard"}
            key={path}
            title={isExpanded ? undefined : label}
            to={path}>
            <NavigationIcon aria-hidden="true" className="size-5 shrink-0" />
            {isExpanded && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <Button
          aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          className={cn("h-11", isExpanded ? "w-full justify-start gap-3 px-3" : "w-full px-0")}
          onClick={onToggle}
          title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          type="button"
          variant="ghost">
          {isExpanded ? <ChevronLeft aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}
          {isExpanded && <span>Collapse sidebar</span>}
        </Button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;

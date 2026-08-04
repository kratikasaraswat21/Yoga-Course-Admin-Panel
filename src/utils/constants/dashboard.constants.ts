import { BookOpen, LayoutDashboard } from "lucide-react";

import type { DashboardNavigationItem } from "@/utils/interface/dashboard.interface";

export const DASHBOARD_NAVIGATION_ITEMS: DashboardNavigationItem[] = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    icon: BookOpen,
    label: "Courses",
    path: "/course",
  },
];

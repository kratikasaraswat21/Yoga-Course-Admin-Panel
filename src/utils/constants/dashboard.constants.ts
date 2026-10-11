import { BookOpen, FileText, Gift, LayoutDashboard, MessageSquareHeart } from "lucide-react";

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
  {
    icon: FileText,
    label: "PDF Course Manager",
    path: "/pdf-courses",
  },
  {
    icon: Gift,
    label: "Affiliate Products",
    path: "/affiliate-products",
  },
  {
    icon: MessageSquareHeart,
    label: "Instagram Feedback",
    path: "/instagram-feedback",
  },
];

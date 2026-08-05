import type { PdfCourseStatus } from "@/utils/interface/pdf-course.interface";

export const PDF_STATUSES: PdfCourseStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export const statusClassName: Record<PdfCourseStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  ARCHIVED: "bg-slate-100 text-slate-600 ring-slate-200",
};

import { ArrowRight, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { statusClassName } from "@/utils/constants/global.constants";
import { formatCoursePrice } from "@/utils/helper/course.helper";
import type { PdfCourse } from "@/utils/interface/pdf-course.interface";

function PdfCourseDashboardSection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<PdfCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPdfCourses = useDebounce(async () => {
    try {
      const response = await multipleApiHandler([{ endPoint: "/pdf-course/fetch", protected: true }]);
      const result = response[0];
      const fetchedCourses =
        result?.data?.success && Array.isArray(result.data.data?.pdf_courses) ? result.data.data.pdf_courses : [];
      setCourses(fetchedCourses);

      if (!result?.data?.success) {
        toast.add({
          title: ERROR_MESSAGES.PDF_COURSE_FETCH_FAILED,
          description: ERROR_MESSAGES.PDF_COURSE_FETCH_FAILED,
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    fetchPdfCourses();
  }, []);

  return (
    <Card className="gap-0 rounded-tl-none rounded-bl-none border border-slate-200 py-0 ring-0">
      <CardHeader className="border-b px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">PDF courses</CardTitle>
          <Button className="h-9 px-3 text-xs" onClick={() => navigate("/pdf-courses")} type="button" variant="ghost">
            View all <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <p className="text-sm leading-5 text-slate-500">Recently uploaded PDF learning material.</p>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-4 p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex items-center gap-3" key={index}>
              <Skeleton className="size-12 shrink-0 rounded-lg bg-slate-300" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-slate-300" />
                <Skeleton className="h-3 w-1/2 bg-slate-300" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length ? (
        <div className="divide-y">
          {courses.slice(0, 6).map((course) => (
            <CardContent className="flex items-center gap-3 px-5 py-4" key={course.id}>
              {course.thumbnailUrl ? (
                <img alt="" className="size-12 shrink-0 rounded-lg object-cover" src={course.thumbnailUrl} />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500">
                  <FileText className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{course.title}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{course.pdfFileName}</p>
                <p
                  className={
                    course.isAvailableForFree
                      ? "mt-1 text-xs font-semibold text-emerald-600"
                      : "mt-1 text-xs font-semibold text-slate-700"
                  }>
                  {course.isAvailableForFree ? "Free" : formatCoursePrice(Number(course.price ?? 0))}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide ring-1 ${statusClassName[course.status]}`}>
                {course.status}
              </span>
            </CardContent>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
            <FileText className="size-7" />
          </span>
          <h3 className="mt-4 font-semibold text-slate-950">No PDF courses yet</h3>
          <p className="mt-2 max-w-xs text-sm leading-5 text-slate-500">
            Upload PDF courses to make them available in your library.
          </p>
          <Button className="mt-5 h-10" onClick={() => navigate("/pdf-courses")} type="button">
            Go to PDF Course Manager
          </Button>
        </div>
      )}
    </Card>
  );
}

export default PdfCourseDashboardSection;

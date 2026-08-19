import { ArrowRight, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { formatCoursePrice } from "@/utils/helper/course.helper";
import type { Course, CourseStatus } from "@/utils/interface/course.interface";

const statusClassName: Record<CourseStatus, string> = {
  Draft: "bg-amber-50 text-amber-700 ring-amber-200",
  Published: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Archived: "bg-slate-100 text-slate-600 ring-slate-200",
};

function CourseDashboardSection() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourses = useDebounce(async () => {
    try {
      const response = await multipleApiHandler([{ endPoint: "/course/fetch/all", method: "GET", protected: true }]);
      const result = response[0];
      const apiCourses = result?.data?.success && Array.isArray(result.data.data?.courses) ? result.data.data.courses : [];

      setCourses(
        apiCourses.map((course: Record<string, unknown>) => ({
          id: String(course.id ?? ""),
          title: String(course.title ?? "Untitled course"),
          description: String(course.description ?? ""),
          price: Number(course.price ?? 0),
          discountPercentage: Number(course.discount ?? course.discountPercentage ?? 0),
          payableAmount: Number(course.totalPayableAmount ?? course.payableAmount ?? 0),
          roundPayableAmount: Boolean(course.roundPayableAmount),
          status: String(course.status ?? "DRAFT").toLowerCase().replace(/^./, (letter) => letter.toUpperCase()) as CourseStatus,
          students: Number(course.totalEnrolledStudents ?? course.students ?? 0),
          averageRating: Number(course.averageRating ?? 0),
          totalEnrolledStudents: Number(course.totalEnrolledStudents ?? course.students ?? 0),
          videoCount: Number(course.videoCount ?? 0),
          coverImageName: String(course.thumbnailId ?? ""),
          thumbnailUrl: String(course.thumbnailURL ?? course.thumbnailUrl ?? course.thumbnail_url ?? ""),
          videoFileName: "",
          videoThumbnailMode: "custom",
          videoThumbnailName: String(course.thumbnailId ?? ""),
          updatedAt: String(course.updatedAt ?? course.createdAt ?? ""),
        })),
      );

      if (!result?.data?.success) {
        toast.add({ title: "Courses could not be loaded", description: result?.data?.message ?? "Please try again.", type: "error" });
      }
    } finally {
      setIsLoading(false);
    }
  }, 100);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden rounded-none border-0 py-0 ring-0">
      <CardHeader className="border-b px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Courses</CardTitle>
          <Button className="h-9 px-3 text-xs" onClick={() => navigate("/course")} type="button" variant="ghost">
            View all <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <p className="text-sm leading-5 text-slate-500">All video courses in your library.</p>
      </CardHeader>

      {isLoading ? (
        <div className="space-y-4 p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex items-center gap-3" key={index}>
              <Skeleton className="size-12 shrink-0 rounded-lg bg-slate-300" />
              <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-4 w-3/4 bg-slate-300" /><Skeleton className="h-3 w-1/2 bg-slate-300" /></div>
            </div>
          ))}
        </div>
      ) : courses.length ? (
        <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((course) => (
            <Card className="gap-0 overflow-hidden py-0" key={course.id}>
              {course.thumbnailUrl ? (
                <img alt={`${course.title} thumbnail`} className="h-32 w-full object-cover" src={course.thumbnailUrl} />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-blue-50 text-blue-600">
                  <BookOpen className="size-8" />
                </div>
              )}
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 min-w-0 text-sm font-semibold text-slate-900">{course.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold tracking-wide ring-1 ${statusClassName[course.status] ?? statusClassName.Draft}`}>
                    {course.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  <p>{course.students} students</p>
                  <p className="mt-1 font-semibold text-slate-700">{formatCoursePrice(course.price)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center"><BookOpen className="size-8 text-slate-400" /><h3 className="mt-3 font-semibold">No courses yet</h3><p className="mt-1 text-sm text-slate-500">Create a course to see it here.</p></div>
      )}
    </Card>
  );
}

export default CourseDashboardSection;

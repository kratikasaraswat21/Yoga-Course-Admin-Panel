import { CheckCircle2, Play, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { formatCourseVideos } from "@/utils/helper/course-video.helper";
import { useEffect, useRef, useState } from "react";
import type { CourseVideo } from "./add-course.types";

const ReadyStatus = () => (
  <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
    <CheckCircle2 className="size-4" /> Ready
  </span>
);

const formatDuration = (seconds = 0) =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

function CourseReviewStep({ videos, courseId }: { videos: CourseVideo[]; courseId: string }) {
  const useEffectRef = useRef(false);
  const [course, setCourse] = useState<Record<string, unknown> | null>(null);
  const [showReviewNotice, setShowReviewNotice] = useState(true);
  const fetchCourseDetailsToReview = useDebounce(async () => {
    if (!courseId) return;
    const response = await multipleApiHandler([
      {
        endPoint: `/course/fetch/course/details/${courseId}`,
        protected: true,
        method: "GET",
      },
    ]);

    const res = response[0];

    if (!res?.data?.success || !res.data.data?.course) {
      toast.add({
        description: res?.data?.message ?? "Unable to fetch course details.",
        title: "Course details could not be loaded",
        type: "error",
      });
      return;
    }

    setCourse(res.data.data.course);
  }, 100);

  useEffect(() => {
    if (useEffectRef.current) return;
    useEffectRef.current = true;
    fetchCourseDetailsToReview();
  }, [fetchCourseDetailsToReview]);

  const courseTitle = String(course?.title ?? "");
  const courseDescription = String(course?.description ?? "");
  const coursePrice = Number(course?.price ?? 0);
  const discountPercentage = Number(course?.discount ?? 0);
  const discountAmount = (coursePrice * discountPercentage) / 100;
  const totalPayable = Number(course?.totalPayableAmount ?? coursePrice - discountAmount);
  const courseVideos = Array.isArray(course?.courseVideos) ? formatCourseVideos(course.courseVideos, courseId) : videos;
  const thumbnailUrl = String(course?.thumbnailUrl ?? "");
  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-5 px-4 py-5 sm:px-6 lg:px-6">
      {showReviewNotice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-slate-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-700" /> All good! Review the details and publish your course.
          </div>
          <button
            aria-label="Dismiss review message"
            className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100"
            onClick={() => setShowReviewNotice(false)}
            type="button">
            <X className="size-4" />
          </button>
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-base font-bold">1. Course information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 py-5 text-sm">
            <div className="grid grid-cols-[minmax(110px,35%)_1fr] gap-4">
              <span className="text-slate-500">Title</span>
              <span>{courseTitle || "Loading..."}</span>
            </div>
            <div className="grid grid-cols-[minmax(110px,35%)_1fr] gap-4">
              <span className="text-slate-500">Description</span>
              <span className="leading-6">{courseDescription || "Loading..."}</span>
            </div>
            <div className="grid grid-cols-[minmax(110px,35%)_1fr] gap-4">
              <span className="text-slate-500">Course ID</span>
              <span>{String(course?.id ?? courseId)}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-base font-bold">2. Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 py-5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Course price</span>
              <span>₹{coursePrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Discount</span>
              <span className="text-emerald-700">
                -₹{discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between">
                <span>Total payable</span>
                <strong>₹{totalPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Round off</span>
              <span className="text-slate-500">—</span>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-5 py-4">
            <CardTitle className="text-base font-bold">3. Course thumbnail</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-5">
            {thumbnailUrl ? (
              <img alt={courseTitle} className="aspect-video w-full rounded-lg object-cover" src={thumbnailUrl} />
            ) : (
              <div className="relative h-44 overflow-hidden rounded-lg bg-slate-100" />
            )}
          </CardContent>
        </Card>
        <Card className="h-fit gap-0 self-start py-0">
          <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
            <CardTitle className="text-base font-bold">4. Video lessons</CardTitle>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {courseVideos.length} {courseVideos.length === 1 ? "lesson" : "lessons"}
            </span>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <div className="space-y-3">
              {courseVideos.length ? (
                courseVideos.map((video) => (
                  <div
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition hover:border-slate-300 hover:bg-white hover:shadow-sm"
                    key={video.id}>
                    <div className="group relative flex size-21 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-slate-200 via-slate-300 to-slate-500">
                      {video.thumbnailUrl ? (
                        <img alt="" className="size-full  object-cover" src={video.thumbnailUrl} />
                      ) : (
                        <Play className="size-7 texst-white" fill="currentColor" />
                      )}
                      {video.thumbnailUrl && (
                        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/20 opacity-0 transition group-hover:opacity-100">
                          <span className="flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow">
                            <Play className="ml-0.5 size-4" fill="currentColor" />
                          </span>
                        </span>
                      )}
                      <span className="absolute bottom-1 right-1 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        {formatDuration(video.durationSeconds)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {video.title || video.originalFileName}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">{video.originalFileName}</p>
                    </div>
                    <div className="shrink-0">
                      {video.status === "Ready" ? (
                        <ReadyStatus />
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                          <span className="size-2 rounded-full bg-blue-500" />
                          Processing
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                  No videos uploaded yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CourseReviewStep;

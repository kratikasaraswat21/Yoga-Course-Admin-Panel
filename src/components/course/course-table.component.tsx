import {
  BarChart3,
  BookOpen,
  Globe,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Percent,
  Rocket,
  Send,
  Star,
  Trash2,
  Users,
  Video,
} from "lucide-react";

import CourseStatusBadge from "@/components/course/course-status-badge.component";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import RichTextContent from "@/components/ui/rich-text-content";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCourseDate, formatCoursePrice } from "@/utils/helper/course.helper";
import { isValidUrl } from "@/utils/helper/helper";
import type { Course } from "@/utils/interface/course.interface";

const PRELAUNCH_BADGE: Record<string, { label: string; className: string } | undefined> = {
  UPCOMING: { label: "Prelaunch soon", className: "bg-blue-50 text-blue-700" },
  LIVE: { label: "Prelaunch live", className: "bg-amber-50 text-amber-800" },
  ENDED: { label: "Prelaunch ended", className: "bg-slate-100 text-slate-600" },
};

/** Small badges for the optional landing page and the prelaunch offer. */
function CourseFeatureBadges({ course }: { course: Course }) {
  const prelaunchBadge = course.prelaunchState ? PRELAUNCH_BADGE[course.prelaunchState] : undefined;
  if (!course.landingPageEnabled && !prelaunchBadge && !course.sequentialUnlock) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {course.landingPageEnabled && (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
          <Globe aria-hidden="true" className="size-3" /> Landing page
        </span>
      )}
      {course.sequentialUnlock && (
        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
          <ListOrdered aria-hidden="true" className="size-3" /> Videos in order
        </span>
      )}
      {prelaunchBadge && (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${prelaunchBadge.className}`}>
          <Rocket aria-hidden="true" className="size-3" /> {prelaunchBadge.label}
          {course.prelaunchState !== "ENDED" && course.prelaunchDiscount ? ` · ${course.prelaunchDiscount}% off` : ""}
        </span>
      )}
    </div>
  );
}

interface CourseTableProps {
  courses: Course[];
  isLoading?: boolean;
  onDelete: (course: Course) => void;
  onEdit: (course: Course) => void;
  onPublish: (course: Course) => void;
  onAnalytics: (course: Course) => void;
}

interface CourseActionsProps {
  course: Course;
  onDelete: (course: Course) => void;
  onEdit: (course: Course) => void;
  onPublish: (course: Course) => void;
  onAnalytics: (course: Course) => void;
}

function CourseActions({ course, onDelete, onEdit, onPublish, onAnalytics }: CourseActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button aria-label={`Actions for ${course.title}`} size="icon" type="button" variant="ghost" />}>
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 rounded-xl border border-slate-200/80 p-1.5 shadow-lg">
        <DropdownMenuItem
          className="h-9 cursor-pointer gap-2 px-3 text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
          onClick={() => onEdit(course)}>
          <Pencil aria-hidden="true" className="size-4 text-slate-500" />
          Edit course
        </DropdownMenuItem>
        <DropdownMenuItem
          className="h-9 cursor-pointer gap-2 px-3 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
          disabled={course.status === "Published"}
          onClick={() => onPublish(course)}>
          <Send aria-hidden="true" className="size-4 text-emerald-600" />
          {course.status === "Published" ? "Published" : "Publish course"}
        </DropdownMenuItem>
        {course.status === "Published" && (
          <DropdownMenuItem
            className="h-9 cursor-pointer gap-2 px-3 text-slate-700 hover:bg-blue-50 hover:text-blue-700 focus:bg-blue-50 focus:text-blue-700"
            onClick={() => onAnalytics(course)}>
            <BarChart3 aria-hidden="true" className="size-4 text-blue-600" />
            View analytics
          </DropdownMenuItem>
        )}
        {(course.totalEnrolledStudents ?? course.students) === 0 && (
          <>
            <DropdownMenuSeparator className="my-1.5 bg-slate-200" />
            <DropdownMenuItem
              className="h-9 cursor-pointer gap-2 px-3 text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
              onClick={() => onDelete(course)}
              variant="destructive">
              <Trash2 aria-hidden="true" className="size-4" />
              Delete course
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyCourseState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <BookOpen aria-hidden="true" />
      </div>
      <h3 className="mt-4 font-semibold">No courses found</h3>
      <p className="mt-1 text-sm text-slate-500">Try changing your search or status filter.</p>
    </div>
  );
}

function CourseTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="hidden md:block">
        <div className="grid grid-cols-8 gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-medium text-slate-400">
          {Array.from({ length: 8 }).map((_, index) => (
            <span className="h-3 rounded bg-slate-200" key={index} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="grid grid-cols-8 items-center gap-4 border-b px-5 py-5" key={index}>
            <span className="col-span-1 h-10 rounded bg-slate-100" />
            <span className="h-5 rounded bg-slate-100" />
            <span className="h-4 rounded bg-slate-100" />
            <span className="h-4 rounded bg-slate-100" />
            <span className="h-4 rounded bg-slate-100" />
            <span className="h-4 rounded bg-slate-100" />
            <span className="h-4 rounded bg-slate-100" />
            <span className="h-5 rounded bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-3 md:hidden">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="h-36 rounded-xl bg-slate-100" key={index} />
        ))}
      </div>
    </div>
  );
}

function CourseTable({ courses, isLoading = false, onDelete, onEdit, onPublish, onAnalytics }: CourseTableProps) {
  if (isLoading) return <CourseTableSkeleton />;
  if (!courses.length) return <EmptyCourseState />;

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="pl-5">Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Videos</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Payable</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-12 pr-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="max-w-80 py-4 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-white">
                      {course.thumbnailUrl && isValidUrl(course.thumbnailUrl) ? (
                        <img
                          alt={`${course.title} thumbnail`}
                          className="size-full object-cover"
                          src={course.thumbnailUrl}
                        />
                      ) : (
                        <BookOpen aria-hidden="true" className="size-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{course.title}</p>
                      <RichTextContent className="mt-1 truncate text-xs text-slate-500" html={course.description} />
                      <CourseFeatureBadges course={course} />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <CourseStatusBadge status={course.status} />
                </TableCell>
                <TableCell>{(course.totalEnrolledStudents ?? course.students).toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                    {course.averageRating ? course.averageRating.toFixed(1) : "—"}
                  </span>
                </TableCell>
                <TableCell>{course.videoCount ?? 0}</TableCell>
                <TableCell>{formatCoursePrice(course.price)}</TableCell>
                <TableCell>{course.discountPercentage}%</TableCell>
                <TableCell className="font-medium">{formatCoursePrice(course.payableAmount)}</TableCell>
                <TableCell className="text-slate-500">{formatCourseDate(course.updatedAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <CourseActions
                    course={course}
                    onAnalytics={onAnalytics}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onPublish={onPublish}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-950 text-white">
                  {course.thumbnailUrl ? (
                    <img
                      alt={`${course.title} thumbnail`}
                      className="size-full object-cover"
                      src={course.thumbnailUrl}
                    />
                  ) : (
                    <BookOpen aria-hidden="true" className="size-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-5">{course.title}</p>
                  <RichTextContent className="mt-1 line-clamp-1 text-xs text-slate-500" html={course.description} />
                  <CourseFeatureBadges course={course} />
                </div>
                <CourseActions
                  course={course}
                  onAnalytics={onAnalytics}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onPublish={onPublish}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CourseStatusBadge status={course.status} />
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  <Star aria-hidden="true" className="size-3.5 fill-amber-400 text-amber-400" />
                  {course.averageRating ? course.averageRating.toFixed(1) : "—"}
                </span>
                {course.discountPercentage > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    {course.discountPercentage}% off
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users aria-hidden="true" className="size-3.5" /> {course.totalEnrolledStudents ?? course.students}
                </span>
                <span className="flex items-center gap-1">
                  <Video aria-hidden="true" className="size-3.5" /> {course.videoCount ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <Percent aria-hidden="true" className="size-3.5" /> {course.discountPercentage}%
                </span>
                <span className="text-right font-medium text-slate-900">{formatCoursePrice(course.payableAmount)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

export default CourseTable;

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import CoursePageHeader from "@/components/course/course-page-header.component";
import CourseTable from "@/components/course/course-table.component";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { COURSES_PER_PAGE, COURSE_STATUSES } from "@/utils/constants/course.constants";
import type { Course, CourseStatus } from "@/utils/interface/course.interface";

type CourseStatusFilter = CourseStatus | "All";

function CourseManagementPage() {
  const navigate = useNavigate();

  const useEffectRef = useRef(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [publishingCourseId, setPublishingCourseId] = useState<string | null>(null);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesStatus = statusFilter === "All" || course.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        [course.title, course.description].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [courses, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const visibleCourses = filteredCourses.slice((activePage - 1) * COURSES_PER_PAGE, activePage * COURSES_PER_PAGE);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    const course = courseToDelete;
    setDeletingCourseId(course.id);

    try {
      const response = await multipleApiHandler([
        { endPoint: `/course/delete/${course.id}`, method: "DELETE", protected: true },
      ]);
      const res = response[0];

      if (!res?.data?.success) {
        toast.add({
          title: `${course.title} Unable to delete`,
          description: res?.data?.message ?? "Please try again.",
          type: "error",
        });
        return;
      }

      setCourses((current) => current.filter((item) => item.id !== course.id));
      setCourseToDelete(null);
      toast.add({
        title: `${course.title} deleted`,
        description: res.data.message ?? "The course was deleted successfully.",
        type: "success",
      });
    } catch {
      toast.add({
        title: `${course.title} Unable to delete`,
        description: "Please check your connection and try again.",
        type: "error",
      });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handlePublishCourse = async (course: Course) => {
    if (publishingCourseId) return;
    setPublishingCourseId(course.id);

    try {
      const response = await multipleApiHandler([
        { endPoint: `/course/publish/${course.id}`, method: "PATCH", protected: true },
      ]);
      const res = response[0];

      if (!res?.data?.success) {
        toast.add({
          title: `${course.title} Unable to publish`,
          description: res?.data?.message ?? "Please try again.",
          type: "error",
        });
        return;
      }

      setCourses((current) =>
        current.map((item) => (item.id === course.id ? { ...item, status: "Published" as CourseStatus } : item)),
      );
      toast.add({
        title: `${course.title} published`,
        description: res.data.message ?? "The course is now live.",
        type: "success",
      });
    } catch {
      toast.add({
        title: `${course.title} Unable to publish`,
        description: "Please check your connection and try again.",
        type: "error",
      });
    } finally {
      setPublishingCourseId(null);
    }
  };

  const fetchAllTheCreatedCourse = useDebounce(async () => {
    try {
      const response = await multipleApiHandler([{ endPoint: "/course/fetch/all", method: "GET", protected: true }]);
      const res = response[0];
      const apiCourses = res?.data?.data?.courses;

      if (!res?.data?.success || !Array.isArray(apiCourses)) {
        throw new Error(res?.data?.message ?? "Unable to fetch courses.");
      }

      setCourses(
        apiCourses.map((course: Record<string, unknown>) => ({
          id: String(course.id ?? ""),
          title: String(course.title ?? "Untitled course"),
          description: String(course.description ?? ""),
          price: Number(course.price ?? 0),
          discountPercentage: Number(course.discount ?? course.discountPercentage ?? 0),
          payableAmount: Number(course.totalPayableAmount ?? course.payableAmount ?? 0),
          roundPayableAmount: Boolean(course.roundPayableAmount),
          status: String(course.status ?? "DRAFT")
            .toLowerCase()
            .replace(/^./, (letter) => letter.toUpperCase()) as CourseStatus,
          students: Number(course.totalEnrolledStudents ?? course.students ?? 0),
          averageRating: Number(course.averageRating ?? 0),
          totalEnrolledStudents: Number(course.totalEnrolledStudents ?? course.students ?? 0),
          videoCount: Number(course.videoCount ?? 0),
          coverImageName: String(course.thumbnailId ?? ""),
          thumbnailUrl: String(course.thumbnailURL ?? course.thumbnailUrl ?? course.thumbnail_url ?? ""),
          videoFileName: "",
          videoThumbnailMode: "custom",
          videoThumbnailName: String(course.thumbnailId ?? ""),
          updatedAt: String(course.updatedAt ?? course.createdAt ?? new Date().toISOString()),
        })),
      );
    } catch (error) {
      toast.add({
        description: error instanceof Error ? error.message : "Unable to fetch courses.",
        title: "Courses could not be loaded",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, 100);

  useEffect(() => {
    if (useEffectRef.current) return;
    useEffectRef.current = true;

    fetchAllTheCreatedCourse();
  }, [fetchAllTheCreatedCourse]);

  return (
    <section className="w-full h-full p-4 sm:p-6 lg:p-8 pb-25!">
      <CoursePageHeader onAddCourse={() => navigate("/course/add")} />

      <Card className="mt-4 gap-0 py-0 sm:mt-6">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 bg-white pl-9"
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search courses..."
              type="search"
              value={searchQuery}
            />
          </div>
          <Select
            onValueChange={(value) => {
              setStatusFilter((value ?? "All") as CourseStatusFilter);
              setCurrentPage(1);
            }}
            value={statusFilter}>
            <SelectTrigger className="h-10 w-full bg-white sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              {COURSE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CourseTable
          courses={visibleCourses}
          isLoading={isLoading}
          onDelete={setCourseToDelete}
          onEdit={(course) => navigate(`/course/edit?id=${course.id}`)}
          onPublish={handlePublishCourse}
        />

        <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {filteredCourses.length ? (activePage - 1) * COURSES_PER_PAGE + 1 : 0}–
            {Math.min(activePage * COURSES_PER_PAGE, filteredCourses.length)} of {filteredCourses.length}
          </p>
          <Pagination className="mx-0 w-auto justify-start sm:justify-end">
            <PaginationContent>
              <PaginationItem>
                <Button
                  disabled={activePage === 1}
                  onClick={() => setCurrentPage(activePage - 1)}
                  size="sm"
                  type="button"
                  variant="outline">
                  Previous
                </Button>
              </PaginationItem>
              <PaginationItem>
                <span className="px-2 text-xs font-medium text-slate-700">
                  Page {activePage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <Button
                  disabled={activePage === totalPages}
                  onClick={() => setCurrentPage(activePage + 1)}
                  size="sm"
                  type="button"
                  variant="outline">
                  Next
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>

      <AlertDialog open={Boolean(courseToDelete)} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              “{courseToDelete?.title}” will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deletingCourseId === courseToDelete?.id}
              onClick={handleDeleteCourse}
              variant="destructive">
              {deletingCourseId === courseToDelete?.id ? "Deleting..." : "Delete course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default CourseManagementPage;

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
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
import { COURSES_PER_PAGE, COURSE_STATUSES } from "@/utils/constants/course.constants";
import { getMockCourses, storeMockCourses } from "@/utils/helper/course.helper";
import type { Course, CourseStatus } from "@/utils/interface/course.interface";

type CourseStatusFilter = CourseStatus | "All";

function CourseManagementPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>(getMockCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CourseStatusFilter>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesStatus = statusFilter === "All" || course.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        [course.title, course.description].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      return matchesStatus && matchesSearch;
    });
  }, [courses, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / COURSES_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const visibleCourses = filteredCourses.slice(
    (activePage - 1) * COURSES_PER_PAGE,
    activePage * COURSES_PER_PAGE,
  );

  const handleDeleteCourse = () => {
    if (!courseToDelete) return;
    const updatedCourses = courses.filter((course) => course.id !== courseToDelete.id);
    setCourses(updatedCourses);
    storeMockCourses(updatedCourses);
    setCourseToDelete(null);
    toast.add({ title: "Course deleted", description: "The course was removed from the mock list.", type: "success" });
  };

  return (
    <section className="w-full h-full p-4 sm:p-6 lg:p-8 pb-25!">
      <CoursePageHeader onAddCourse={() => navigate("/course/add")} />

      <Card className="gap-0 py-0">
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
          onDelete={setCourseToDelete}
          onEdit={(course) => navigate(`/course/edit?id=${course.id}`)}
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
              “{courseToDelete?.title}” will be removed from the course list. This mock action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} variant="destructive">
              Delete course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default CourseManagementPage;

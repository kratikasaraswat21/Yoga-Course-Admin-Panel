import { BookOpen, MoreHorizontal, Pencil, Percent, Trash2, Users } from "lucide-react";

import CourseStatusBadge from "@/components/course/course-status-badge.component";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCourseDate, formatCoursePrice } from "@/utils/helper/course.helper";
import type { Course } from "@/utils/interface/course.interface";

interface CourseTableProps {
  courses: Course[];
  onDelete: (course: Course) => void;
  onEdit: (course: Course) => void;
}

interface CourseActionsProps {
  course: Course;
  onDelete: (course: Course) => void;
  onEdit: (course: Course) => void;
}

function CourseActions({ course, onDelete, onEdit }: CourseActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button aria-label={`Actions for ${course.title}`} size="icon" type="button" variant="ghost" />
        }>
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem className="cursor-pointer" onClick={() => onEdit(course)}>
          <Pencil aria-hidden="true" />
          Edit course
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => onDelete(course)} variant="destructive">
          <Trash2 aria-hidden="true" />
          Delete course
        </DropdownMenuItem>
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

function CourseTable({ courses, onDelete, onEdit }: CourseTableProps) {
  if (!courses.length) return <EmptyCourseState />;

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="pl-5">Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Students</TableHead>
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
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                      <BookOpen aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{course.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{course.description}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <CourseStatusBadge status={course.status} />
                </TableCell>
                <TableCell>{course.students.toLocaleString("en-IN")}</TableCell>
                <TableCell>{formatCoursePrice(course.price)}</TableCell>
                <TableCell>{course.discountPercentage}%</TableCell>
                <TableCell className="font-medium">{formatCoursePrice(course.payableAmount)}</TableCell>
                <TableCell className="text-slate-500">{formatCourseDate(course.updatedAt)}</TableCell>
                <TableCell className="pr-4 text-right">
                  <CourseActions course={course} onDelete={onDelete} onEdit={onEdit} />
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
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <BookOpen aria-hidden="true" className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-5">{course.title}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-500">{course.description}</p>
                </div>
                <CourseActions course={course} onDelete={onDelete} onEdit={onEdit} />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <CourseStatusBadge status={course.status} />
                {course.discountPercentage > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                    {course.discountPercentage}% off
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users aria-hidden="true" className="size-3.5" /> {course.students}
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

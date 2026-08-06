import { BookOpen } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import CourseForm from "@/components/course/course-form.component";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/variants/toast.manager";
import { calculatePayableAmount, getMockCourses, storeMockCourses } from "@/utils/helper/course.helper";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import type { Course, CourseFormData } from "@/utils/interface/course.interface";

function CourseEditorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");
  const courses = getMockCourses();
  const course = courseId ? (courses.find((currentCourse) => currentCourse.id === courseId) ?? null) : null;
  const isEditing = Boolean(courseId);

  const returnToCourseList = () => navigate("/course");

  const handleSaveCourse = (formData: CourseFormData) => {
    const price = Number(formData.price);
    const discountPercentage = Number(formData.discountPercentage);
    const savedCourse: Course = {
      id: course?.id ?? `course-${Date.now()}`,
      title: formData.title.trim(),
      description: formData.description.trim(),
      price,
      discountPercentage,
      payableAmount: calculatePayableAmount(price, discountPercentage, formData.roundPayableAmount),
      roundPayableAmount: formData.roundPayableAmount,
      status: course?.status ?? "Draft",
      students: course?.students ?? 0,
      coverImageName: formData.coverImageName,
      videoFileName: formData.videoFileName,
      videoThumbnailMode: formData.videoThumbnailMode,
      videoThumbnailName: formData.videoThumbnailName,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const updatedCourses = course
      ? courses.map((currentCourse) => (currentCourse.id === course.id ? savedCourse : currentCourse))
      : [savedCourse, ...courses];

    storeMockCourses(updatedCourses);
    toast.add({
      description: course ? SUCCESS_MESSAGES.COURSE_UPDATED_DESCRIPTION : SUCCESS_MESSAGES.COURSE_CREATED_DESCRIPTION,
      title: course ? SUCCESS_MESSAGES.COURSE_UPDATED_TITLE : SUCCESS_MESSAGES.COURSE_CREATED_TITLE,
      type: "success",
    });
    returnToCourseList();
  };

  if (isEditing && !course) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <BookOpen aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">{ERROR_MESSAGES.COURSE_NOT_FOUND_TITLE}</h2>
          <p className="mt-2 text-sm text-slate-500">{ERROR_MESSAGES.COURSE_NOT_FOUND_DESCRIPTION}</p>
          <Button className="mt-6 h-11" onClick={returnToCourseList} type="button">
            Return to courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <CourseForm course={course} onCancel={returnToCourseList} onSubmit={handleSaveCourse} />
    </section>
  );
}

export default CourseEditorPage;

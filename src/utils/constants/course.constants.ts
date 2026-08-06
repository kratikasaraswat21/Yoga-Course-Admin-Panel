import type { CourseFormData, CourseStatus } from "@/utils/interface/course.interface";

export const COURSE_STATUSES: CourseStatus[] = ["Draft", "Published", "Archived"];

export const EMPTY_COURSE_FORM: CourseFormData = {
  title: "",
  description: "",
  price: "",
  discountPercentage: "0",
  roundPayableAmount: false,
  coverImageName: "",
  videoFileName: "",
  videoThumbnailMode: "automatic",
  videoThumbnailName: "",
};

export const COURSES_PER_PAGE = 5;

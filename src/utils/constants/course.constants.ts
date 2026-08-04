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

export const COURSE_ERROR_MESSAGES = {
  TITLE_REQUIRED: "Please enter a course title.",
  DESCRIPTION_REQUIRED: "Please enter a course description.",
  PRICE_INVALID: "Price must be zero or greater.",
  DISCOUNT_INVALID: "Discount must be between 0 and 100 percent.",
} as const;

export const COURSES_PER_PAGE = 5;

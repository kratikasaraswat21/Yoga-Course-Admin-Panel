import type { AddCourseDetails } from "@/modules/course/add-course/add-course.types";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseFormData, CourseFormErrors } from "@/utils/interface/course.interface";

const hasRichTextContent = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length > 0;

export type AddCourseDetailsErrors = Partial<
  Record<"title" | "description" | "price" | "discountPercentage" | "totalPayableAmount" | "thumbnailURL", string>
>;

export const validateCourseForm = (formData: CourseFormData) => {
  const errors: CourseFormErrors = {};

  if (!formData.title.trim()) errors.title = ERROR_MESSAGES.COURSE_TITLE_REQUIRED;
  if (!hasRichTextContent(formData.description)) errors.description = ERROR_MESSAGES.COURSE_DESCRIPTION_REQUIRED;

  const price = Number(formData.price);
  if (formData.price === "" || !Number.isFinite(price) || price < 0) {
    errors.price = ERROR_MESSAGES.COURSE_PRICE_INVALID;
  }

  const discountPercentage = Number(formData.discountPercentage);
  if (
    formData.discountPercentage === "" ||
    !Number.isFinite(discountPercentage) ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    errors.discountPercentage = ERROR_MESSAGES.COURSE_DISCOUNT_INVALID;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateAddCourseDetails = (details: AddCourseDetails) => {
  console.log(details);
  const errors: AddCourseDetailsErrors = {};
  const price = Number(details.price);
  const discountPercentage = Number(details.discountPercentage);
  const totalPayableAmount = price - (price * discountPercentage) / 100;

  if (!details.title.trim()) errors.title = ERROR_MESSAGES.COURSE_TITLE_REQUIRED;
  if (!hasRichTextContent(details.description)) errors.description = ERROR_MESSAGES.COURSE_DESCRIPTION_REQUIRED;
  if (details.price === "" || !Number.isFinite(price) || price <= 0) {
    errors.price = ERROR_MESSAGES.COURSE_PRICE_INVALID;
  }
  if (
    details.discountPercentage === "" ||
    !Number.isFinite(discountPercentage) ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    errors.discountPercentage = ERROR_MESSAGES.COURSE_DISCOUNT_INVALID;
  }
  if (!Number.isFinite(totalPayableAmount) || totalPayableAmount < 0) {
    errors.totalPayableAmount = ERROR_MESSAGES.COURSE_PAYABLE_AMOUNT_INVALID;
  }
  if (!details.thumbnailURL) errors.thumbnailURL = ERROR_MESSAGES.COURSE_THUMBNAIL_REQUIRED;

  return { errors, isValid: Object.keys(errors).length === 0 };
};

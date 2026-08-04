import { COURSE_ERROR_MESSAGES } from "@/utils/constants/course.constants";
import type { CourseFormData, CourseFormErrors } from "@/utils/interface/course.interface";

export const validateCourseForm = (formData: CourseFormData) => {
  const errors: CourseFormErrors = {};

  if (!formData.title.trim()) errors.title = COURSE_ERROR_MESSAGES.TITLE_REQUIRED;
  if (!formData.description.trim()) errors.description = COURSE_ERROR_MESSAGES.DESCRIPTION_REQUIRED;

  const price = Number(formData.price);
  if (formData.price === "" || !Number.isFinite(price) || price < 0) {
    errors.price = COURSE_ERROR_MESSAGES.PRICE_INVALID;
  }

  const discountPercentage = Number(formData.discountPercentage);
  if (
    formData.discountPercentage === "" ||
    !Number.isFinite(discountPercentage) ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    errors.discountPercentage = COURSE_ERROR_MESSAGES.DISCOUNT_INVALID;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseFormData, CourseFormErrors } from "@/utils/interface/course.interface";

export const validateCourseForm = (formData: CourseFormData) => {
  const errors: CourseFormErrors = {};

  if (!formData.title.trim()) errors.title = ERROR_MESSAGES.COURSE_TITLE_REQUIRED;
  if (!formData.description.trim()) errors.description = ERROR_MESSAGES.COURSE_DESCRIPTION_REQUIRED;

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

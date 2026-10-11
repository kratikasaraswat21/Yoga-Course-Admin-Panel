import type { AddCourseDetails } from "@/modules/course/add-course/add-course.types";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseFormData, CourseFormErrors } from "@/utils/interface/course.interface";
import { calculatePayableAmount } from "@/utils/helper/course.helper";
import { addDaysToDate, getIstToday, isValidDateInput } from "@/utils/helper/ist-date.helper";
import { COURSE_SLUG_MAX_LENGTH, COURSE_SLUG_PATTERN } from "@/utils/helper/slug.helper";

const hasRichTextContent = (value: string) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;

export type AddCourseDetailsErrors = Partial<
  Record<
    | "title"
    | "slug"
    | "description"
    | "price"
    | "discountPercentage"
    | "totalPayableAmount"
    | "thumbnailURL"
    | "prelaunchStartDate"
    | "prelaunchEndDate"
    | "prelaunchDiscount",
    string
  >
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

/** The prelaunch offer can run for at most this many days (end date - start date). */
export const MAX_PRELAUNCH_DAYS = 20;

/**
 * Prelaunch checks shown while the admin types. Only fields that have a value are checked, so
 * turning the offer on doesn't immediately show "required" errors; those come on save.
 */
export const validatePrelaunchDetails = (details: AddCourseDetails, savedPrelaunchStartDate = "") => {
  const errors: AddCourseDetailsErrors = {};
  if (!details.prelaunchEnabled) return errors;

  const today = getIstToday();
  const { prelaunchStartDate: startDate, prelaunchEndDate: endDate } = details;
  const hasStartDate = isValidDateInput(startDate);

  if (hasStartDate && startDate < today && startDate !== savedPrelaunchStartDate) {
    errors.prelaunchStartDate = ERROR_MESSAGES.PRELAUNCH_START_DATE_PAST;
  }

  if (isValidDateInput(endDate)) {
    if (hasStartDate && endDate <= startDate) errors.prelaunchEndDate = ERROR_MESSAGES.PRELAUNCH_END_DATE_BEFORE_START;
    else if (endDate <= today) errors.prelaunchEndDate = ERROR_MESSAGES.PRELAUNCH_END_DATE_PAST;
    else if (hasStartDate && endDate > addDaysToDate(startDate, MAX_PRELAUNCH_DAYS)) {
      errors.prelaunchEndDate = ERROR_MESSAGES.PRELAUNCH_TOO_LONG;
    }
  }

  if (details.prelaunchDiscount !== "") {
    const prelaunchDiscount = Number(details.prelaunchDiscount);
    if (!Number.isFinite(prelaunchDiscount) || prelaunchDiscount <= 0 || prelaunchDiscount > 100) {
      errors.prelaunchDiscount = ERROR_MESSAGES.PRELAUNCH_DISCOUNT_INVALID;
    } else if (calculatePayableAmount(Number(details.price) || 0, prelaunchDiscount, details.roundPayableAmount) <= 0) {
      errors.prelaunchDiscount = ERROR_MESSAGES.PRELAUNCH_PAYABLE_AMOUNT_INVALID;
    }
  }

  return errors;
};

/**
 * `savedPrelaunchStartDate` is the start date already saved on the course. A prelaunch that has
 * already started can keep that date even though it is now in the past.
 */
export const validateAddCourseDetails = (details: AddCourseDetails, savedPrelaunchStartDate = "") => {
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

  const slug = details.slug.trim();
  if (!slug) errors.slug = ERROR_MESSAGES.COURSE_SLUG_REQUIRED;
  else if (slug.length > COURSE_SLUG_MAX_LENGTH || !COURSE_SLUG_PATTERN.test(slug)) {
    errors.slug = ERROR_MESSAGES.COURSE_SLUG_INVALID;
  }

  if (details.prelaunchEnabled) {
    Object.assign(errors, validatePrelaunchDetails(details, savedPrelaunchStartDate));
    if (!isValidDateInput(details.prelaunchStartDate)) {
      errors.prelaunchStartDate = ERROR_MESSAGES.PRELAUNCH_START_DATE_REQUIRED;
    }
    if (!isValidDateInput(details.prelaunchEndDate))
      errors.prelaunchEndDate = ERROR_MESSAGES.PRELAUNCH_END_DATE_REQUIRED;
    if (details.prelaunchDiscount === "") errors.prelaunchDiscount = ERROR_MESSAGES.PRELAUNCH_DISCOUNT_INVALID;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

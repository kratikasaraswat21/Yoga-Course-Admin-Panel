import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseVideoConfiguration } from "@/modules/course/add-course/add-course.types";

export type CourseVideoConfigurationErrors = Partial<Record<"title" | "thumbnailFile", string>>;

export const validateCourseVideoConfiguration = (configuration: CourseVideoConfiguration) => {
  const errors: CourseVideoConfigurationErrors = {};

  if (!configuration.formData.title.trim()) errors.title = ERROR_MESSAGES.COURSE_VIDEO_TITLE_REQUIRED;
  if (configuration.formData.thumbnailType === "custom" && !configuration.formData.thumbnailUrl && !configuration.formData.thumbnailFile) {
    errors.thumbnailFile = ERROR_MESSAGES.COURSE_VIDEO_THUMBNAIL_REQUIRED;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateCourseVideoFile = (file: File) => {
  if (!ERROR_MESSAGES.COURSE_VIDEO_ALLOWED_TYPES.some((type) => type === file.type)) {
    return ERROR_MESSAGES.COURSE_VIDEO_INVALID;
  }
  if (file.size > 5 * 1024 * 1024 * 1024) return ERROR_MESSAGES.COURSE_VIDEO_SIZE_INVALID;
  return undefined;
};

export const validateCourseVideoThumbnail = (file: File) =>
  file.type.startsWith("image/") ? undefined : ERROR_MESSAGES.COURSE_VIDEO_THUMBNAIL_INVALID;

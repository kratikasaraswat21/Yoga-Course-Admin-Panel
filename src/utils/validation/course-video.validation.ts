import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseVideoConfiguration } from "@/modules/course/add-course/add-course.types";
import { addDaysToDate, getIstToday } from "@/utils/helper/ist-date.helper";

export type CourseVideoConfigurationErrors = Partial<Record<"title" | "thumbnailFile" | "releaseDate", string>>;

export const MAX_VIDEO_RELEASE_DAYS_AHEAD = 60;

/**
 * Optional release date: empty means "visible as soon as processing finishes". Otherwise it must be
 * between today and today + 60 days (IST). A date already saved on the video may be kept as it is.
 */
export const validateVideoReleaseDate = (releaseDate: string, savedReleaseDate = "") => {
  if (!releaseDate || releaseDate === savedReleaseDate) return undefined;

  const today = getIstToday();
  if (releaseDate < today) return ERROR_MESSAGES.VIDEO_RELEASE_DATE_PAST;
  if (releaseDate > addDaysToDate(today, MAX_VIDEO_RELEASE_DAYS_AHEAD))
    return ERROR_MESSAGES.VIDEO_RELEASE_DATE_TOO_FAR;
  return undefined;
};

export const validateCourseVideoConfiguration = (configuration: CourseVideoConfiguration, savedReleaseDate = "") => {
  const errors: CourseVideoConfigurationErrors = {};

  const releaseDateError = validateVideoReleaseDate(configuration.formData.releaseDate, savedReleaseDate);
  if (releaseDateError) errors.releaseDate = releaseDateError;

  if (!configuration.formData.title.trim()) errors.title = ERROR_MESSAGES.COURSE_VIDEO_TITLE_REQUIRED;
  if (!configuration.formData.thumbnailUrl && !configuration.formData.thumbnailFile) {
    errors.thumbnailFile = ERROR_MESSAGES.COURSE_VIDEO_THUMBNAIL_REQUIRED;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateCourseVideoFile = (file: File) => {
  if (!ERROR_MESSAGES.COURSE_VIDEO_ALLOWED_TYPES.some((type) => type === file.type)) {
    return ERROR_MESSAGES.COURSE_VIDEO_INVALID;
  }
  return undefined;
};

export const validateCourseVideoThumbnail = (file: File) =>
  file.type.startsWith("image/") ? undefined : ERROR_MESSAGES.COURSE_VIDEO_THUMBNAIL_INVALID;

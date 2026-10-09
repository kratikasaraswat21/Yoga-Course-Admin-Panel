export const COURSE_SLUG_MAX_LENGTH = 80;
export const COURSE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Mirrors the backend slug rules: lowercase letters, numbers and single hyphens. */
export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, COURSE_SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");

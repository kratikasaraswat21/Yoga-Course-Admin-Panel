export const INSTAGRAM_FEEDBACK_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_INSTAGRAM_FEEDBACK_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/** Returns the reason a file can't be uploaded, or null when it's fine. */
export const validateInstagramFeedbackImage = (file: File) => {
  if (!INSTAGRAM_FEEDBACK_IMAGE_TYPES.includes(file.type)) return `${file.name}: choose a PNG, JPG or WebP image.`;
  if (file.size > MAX_INSTAGRAM_FEEDBACK_IMAGE_SIZE) return `${file.name}: the image must be 5 MB or smaller.`;
  return null;
};

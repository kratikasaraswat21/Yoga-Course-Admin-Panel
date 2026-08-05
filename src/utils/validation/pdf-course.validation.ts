import type { PdfCourseFormData, PdfCourseFormErrors } from "@/utils/interface/pdf-course.interface";

export const validatePdfCourseForm = (formData: PdfCourseFormData) => {
  const errors: PdfCourseFormErrors = {};

  if (!formData.title.trim()) errors.title = "Enter a title.";
  if (!formData.description.trim()) errors.description = "Enter a description.";
  if (!formData.fileUrl) errors.fileUrl = "Choose a PDF file.";
  if (!formData.thumbnailUrl) errors.thumbnailUrl = "Choose a thumbnail.";

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validatePdfFile = (file: File) => (file.type === "application/pdf" ? undefined : "Choose a PDF file.");

export const validatePdfThumbnail = (file: File) =>
  file.type.startsWith("image/") ? undefined : "Choose an image thumbnail.";

import type { PdfCourseFormData, PdfCourseFormErrors } from "@/utils/interface/pdf-course.interface";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";

export const validatePdfCourseForm = (formData: PdfCourseFormData) => {
  const errors: PdfCourseFormErrors = {};

  // Drafts may be incomplete while they are being worked on, but still need a title.
  if (formData.status === "DRAFT") {
    if (!formData.title.trim()) errors.title = ERROR_MESSAGES.PDF_TITLE_REQUIRED;
    return { errors, isValid: Object.keys(errors).length === 0 };
  }

  if (!formData.title.trim()) errors.title = ERROR_MESSAGES.PDF_TITLE_REQUIRED;
  if (!formData.description.trim()) errors.description = ERROR_MESSAGES.PDF_DESCRIPTION_REQUIRED;
  if (!formData.fileUrl) errors.fileUrl = ERROR_MESSAGES.PDF_FILE_REQUIRED;
  if (!formData.thumbnailUrl) errors.thumbnailUrl = ERROR_MESSAGES.PDF_THUMBNAIL_REQUIRED;

  if (!formData.isAvailableForFree) {
    if (!Number.isFinite(formData.price) || formData.price <= 0) errors.price = ERROR_MESSAGES.PDF_PRICE_INVALID;
    if (!Number.isFinite(formData.discount) || formData.discount < 0 || formData.discount > 100) {
      errors.discount = ERROR_MESSAGES.PDF_DISCOUNT_INVALID;
    }
    if (formData.totalPayableAmount < 0) errors.totalPayableAmount = ERROR_MESSAGES.PDF_PAYABLE_AMOUNT_INVALID;
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validatePdfFile = (file: File) => (file.type === "application/pdf" ? undefined : "Choose a PDF file.");

export const validatePdfThumbnail = (file: File) =>
  file.type.startsWith("image/") ? undefined : "Choose an image thumbnail.";

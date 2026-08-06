import type React from "react";
import type { SetStateAction } from "react";

export type PdfCourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface PdfCourse {
  id: string;
  title: string;
  description: string;
  pdfFileName: string;
  fileUrl: string;
  thumbnailName: string;
  thumbnailUrl: string;
  price: number;
  discount: number;
  totalPayableAmount: number;
  isAvailableForFree: boolean;
  status: PdfCourseStatus;
  updatedAt: string;
}

export interface PdfCourseFormData {
  title: string;
  description: string;
  pdfFileName: string;
  fileUrl: string;
  thumbnailUrl: string;
  price: number;
  discount: number;
  totalPayableAmount: number;
  isAvailableForFree: boolean;
  status: PdfCourseStatus;
}

export type PdfCourseFormErrors = Partial<Record<keyof PdfCourseFormData, string>>;

export type PendingUpload = { type: "pdf" | "thumbnail"; file: File; previewUrl?: string };

export interface uploadPdfCourseInterface {
  isDrawerOpen: boolean;
  formData: PdfCourseFormData;
  errors: PdfCourseFormErrors;
  isPdfDragging: boolean;
  isThumbnailDragging: boolean;
  isEditing?: boolean;
  editCourseId: string;
  thumbnailPreview: string;
  pendingUpload: PendingUpload | null;
  setFormData: React.Dispatch<SetStateAction<PdfCourseFormData>>;
  setErrors: React.Dispatch<SetStateAction<PdfCourseFormErrors>>;
  setPendingUpload: React.Dispatch<SetStateAction<PendingUpload | null>>;
  setThumbnailPreview: React.Dispatch<SetStateAction<string>>;
  setIsThumbnailDragging: React.Dispatch<SetStateAction<boolean>>;
  setIsPdfDragging: React.Dispatch<SetStateAction<boolean>>;
  setIsDrawerOpen: React.Dispatch<SetStateAction<boolean>>;
  reFetchThePdfCourseData: () => void;
}

export interface MediaSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  upload_info: {
    signature: string;
    folder: string;
    resourceType: "image";
  };
}

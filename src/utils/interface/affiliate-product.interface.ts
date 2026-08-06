import type React from "react";
import type { SetStateAction } from "react";

export type AffiliateProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AffiliateProductFormData {
  title: string;
  description: string;
  affiliateLink: string;
  thumbnailUrl: string;
  status: AffiliateProductStatus;
  buttonTitle: string;
  sortOrder: number;
}

export interface AffiliateProduct extends AffiliateProductFormData {
  id: string;
}

export type AffiliateProductFormErrors = Partial<Record<keyof AffiliateProductFormData, string>>;
export type PendingAffiliateThumbnail = { file: File; previewUrl: string };

export interface AffiliateProductFormProps {
  isEditing: boolean;
  editingProductId: string | null;
  isDrawerOpen: boolean;
  formData: AffiliateProductFormData;
  errors: AffiliateProductFormErrors;
  thumbnailPreview: string;
  pendingThumbnail: PendingAffiliateThumbnail | null;
  setFormData: React.Dispatch<SetStateAction<AffiliateProductFormData>>;
  setErrors: React.Dispatch<SetStateAction<AffiliateProductFormErrors>>;
  setThumbnailPreview: React.Dispatch<SetStateAction<string>>;
  setPendingThumbnail: React.Dispatch<SetStateAction<PendingAffiliateThumbnail | null>>;
  setIsDrawerOpen: React.Dispatch<SetStateAction<boolean>>;
  reFetchAffiliateProducts: () => void;
}

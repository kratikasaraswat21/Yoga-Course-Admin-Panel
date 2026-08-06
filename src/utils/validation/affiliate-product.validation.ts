import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { AffiliateProductFormData, AffiliateProductFormErrors } from "@/utils/interface/affiliate-product.interface";

export const validateAffiliateProductForm = (formData: AffiliateProductFormData) => {
  const errors: AffiliateProductFormErrors = {};
  if (!formData.title.trim()) errors.title = ERROR_MESSAGES.AFFILIATE_TITLE_REQUIRED;

  // Drafts can be saved while the product details are still being prepared.
  if (formData.status === "DRAFT") {
    return { errors, isValid: Object.keys(errors).length === 0 };
  }

  if (!formData.affiliateLink.trim()) {
    errors.affiliateLink = ERROR_MESSAGES.AFFILIATE_LINK_REQUIRED;
  } else if (!/^https?:\/\//i.test(formData.affiliateLink.trim())) {
    errors.affiliateLink = ERROR_MESSAGES.AFFILIATE_LINK_INVALID;
  }
  if (!formData.thumbnailUrl) errors.thumbnailUrl = ERROR_MESSAGES.AFFILIATE_THUMBNAIL_REQUIRED;
  if (!formData.buttonTitle.trim()) errors.buttonTitle = ERROR_MESSAGES.AFFILIATE_BUTTON_TEXT_REQUIRED;
  return { errors, isValid: Object.keys(errors).length === 0 };
};

export const validateAffiliateThumbnail = (file: File) =>
  file.type.startsWith("image/") ? undefined : ERROR_MESSAGES.AFFILIATE_THUMBNAIL_INVALID;

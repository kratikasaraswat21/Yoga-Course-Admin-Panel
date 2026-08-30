import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { PDF_STATUSES } from "@/utils/constants/global.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import type {
  AffiliateProductFormData,
  AffiliateProductFormProps,
  AffiliateProductStatus,
  PendingAffiliateThumbnail,
} from "@/utils/interface/affiliate-product.interface";
import type { MediaSignature } from "@/utils/interface/pdf-course.interface";
import {
  validateAffiliateProductForm,
  validateAffiliateThumbnail,
} from "@/utils/validation/affiliate-product.validation";
import axios from "axios";
import { ImageUp, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

function UploadAffiliateProductSidebar({
  isDrawerOpen,
  formData,
  errors,
  thumbnailPreview,
  pendingThumbnail,
  setFormData,
  setErrors,
  setThumbnailPreview,
  setPendingThumbnail,
  setIsDrawerOpen,
  reFetchAffiliateProducts,
  isEditing,
  editingProductId,
}: AffiliateProductFormProps) {
  const previewUrlRef = useRef("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const updateField = (field: keyof AffiliateProductFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const selectThumbnail = (file?: File) => {
    if (!file) return;
    const error = validateAffiliateThumbnail(file);
    if (error) {
      setErrors((current) => ({ ...current, thumbnailUrl: error }));
      return;
    }
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPendingThumbnail({ file, previewUrl });
  };

  const cancelPendingThumbnail = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setPendingThumbnail(null);
  };

  const uploadImageToCloudinary = async (file: File, signingData: MediaSignature): Promise<string> => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signingData.apiKey);
    body.append("timestamp", String(signingData.timestamp));
    body.append("signature", signingData.upload_info.signature);
    if (signingData.upload_info.folder) body.append("folder", signingData.upload_info.folder);

    const response = await axios.post(`https://api.cloudinary.com/v1_1/${signingData.cloudName}/image/upload`, body);
    const fileUrl = response.data.secure_url ?? response.data.url;
    if (!fileUrl) throw new Error(ERROR_MESSAGES.PDF_FILE_URL_MISSING);
    return fileUrl as string;
  };

  const getAffiliateThumbnailSignature = async (): Promise<MediaSignature> => {
    const response = await multipleApiHandler([
      {
        endPoint: "affiliate-product/cloud/affiliate-products/signature",
        method: "POST",
        protected: true,
      },
    ]);
    const result = response[0];
    if (!result.ok || !result.data?.success || !result.data.data) {
      throw new Error(result.data?.message ?? ERROR_MESSAGES.MEDIA_SIGNATURE_FAILED);
    }
    return result.data.data as unknown as MediaSignature;
  };

  const uploadAffiliateThumbnail = useDebounce(async (thumbnail: PendingAffiliateThumbnail) => {
    const uploadPromise = (async () => {
      const signingData = await getAffiliateThumbnailSignature();
      const fileUrl = await uploadImageToCloudinary(thumbnail.file, signingData);
      setThumbnailPreview(thumbnail.previewUrl);
      setFormData((current) => ({ ...current, thumbnailUrl: fileUrl }));
      setErrors((current) => ({ ...current, thumbnailUrl: undefined }));
      setPendingThumbnail(null);
    })();

    try {
      await toast.promise(uploadPromise, {
        loading: {
          title: SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_TITLE,
          description: SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_DESCRIPTION,
          type: "loading",
        },
        success: {
          title: SUCCESS_MESSAGES.MEDIA_UPLOAD_COMPLETE_TITLE,
          description: SUCCESS_MESSAGES.MEDIA_UPLOAD_COMPLETE_DESCRIPTION,
          type: "success",
        },
        error: (error) => ({
          title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
          description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
          type: "error",
        }),
      });
    } catch {
      // The promise toast displays the upload error.
    } finally {
      setIsUploading(false);
    }
  }, 100);

  const proceedWithThumbnail = () => {
    if (!pendingThumbnail) return;
    setIsUploading(true);
    uploadAffiliateThumbnail(pendingThumbnail);
  };

  const clearThumbnail = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = "";
    setThumbnailPreview("");
    setFormData((current) => ({ ...current, thumbnailUrl: "" }));
  };

  const handelAddAffiliateProducts = useDebounce(async (data: AffiliateProductFormData) => {
    const response = await multipleApiHandler([
      {
        endPoint: isEditing ? `affiliate-product/edit?id=${editingProductId}` : "affiliate-product/add",
        data: data,
        protected: true,
        method: "POST",
      },
    ]);

    const res = response[0];
    toast.add({
      title:
        res?.data?.message ??
        (res?.data?.success ? SUCCESS_MESSAGES.PDF_COURSE_SAVED : ERROR_MESSAGES.PDF_COURSE_SAVE_FAILED),
      positionerProps: {},
      type: res?.data?.success ? "success" : "error",
    });
    if (res?.data?.success) {
      setIsDrawerOpen(false);
      reFetchAffiliateProducts();
    }
    // setLoading(false);
  }, 100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateAffiliateProductForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) return;
    handelAddAffiliateProducts(formData);
  };

  const handleThumbnailDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    selectThumbnail(event.dataTransfer.files?.[0]);
  };

  return (
    <>
      <Drawer onOpenChange={setIsDrawerOpen} open={isDrawerOpen} swipeDirection="right">
        <DrawerContent className="w-full sm:w-[min(100%,32rem)]">
          <DrawerHeader className="flex-row items-start justify-between border-b p-6 text-left">
            <div>
              <DrawerTitle className="text-xl">
                {isEditing ? "Edit affiliate product" : "Add affiliate product"}
              </DrawerTitle>
              <p className="mt-1 text-sm text-slate-500">
                {isEditing
                  ? "Update this product recommendation."
                  : "Create a product recommendation for your students."}
              </p>
            </div>
            <DrawerClose
              render={
                <Button aria-label="Close drawer" className="-mr-2 -mt-2" size="icon" type="button">
                  <X />
                </Button>
              }
            />
          </DrawerHeader>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-2">
                <Label htmlFor="affiliate-title">Title</Label>
                <Input
                  aria-invalid={Boolean(errors.title)}
                  className="h-11 bg-white"
                  id="affiliate-title"
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Yoga mat"
                  value={formData.title}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate-description">
                  Description <span className="font-normal text-slate-400">(optional)</span>
                </Label>
                <RichTextEditor
                  id="affiliate-description"
                  minHeight="min-h-28"
                  onChange={(value) => updateField("description", value)}
                  placeholder="Describe this product..."
                  value={formData.description}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate-link">Affiliate product link</Label>
                <Input
                  aria-invalid={Boolean(errors.affiliateLink)}
                  className="h-11 bg-white"
                  id="affiliate-link"
                  onChange={(event) => updateField("affiliateLink", event.target.value)}
                  placeholder="https://example.com/product"
                  type="url"
                  value={formData.affiliateLink}
                />
                {errors.affiliateLink && <p className="text-sm text-red-500">{errors.affiliateLink}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate-thumbnail">Thumbnail</Label>
                {thumbnailPreview || formData.thumbnailUrl ? (
                  <div className="group relative min-h-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    <img
                      alt="Thumbnail preview"
                      className="size-full min-h-20 object-cover"
                      src={thumbnailPreview || formData.thumbnailUrl}
                    />

                    <button
                      aria-label="Remove selected thumbnail"
                      className="absolute cursor-pointer top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-500 opacity-0 shadow-sm ring-1 ring-slate-200 transition-opacity hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      onClick={clearThumbnail}
                      type="button">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-slate-500"
                    htmlFor="affiliate-thumbnail"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleThumbnailDrop}>
                    <span className="flex size-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                      <ImageUp className="size-6" />
                    </span>
                    <span className="mt-3 text-sm font-medium">Drag and drop an image here</span>
                    <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP · or click to browse</span>
                  </label>
                )}
                <Input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  id="affiliate-thumbnail"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => selectThumbnail(event.target.files?.[0])}
                  type="file"
                />
                {errors.thumbnailUrl && <p className="text-sm text-red-500">{errors.thumbnailUrl}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate-status">Status</Label>
                <Select
                  onValueChange={(value) => updateField("status", value as AffiliateProductStatus)}
                  value={formData.status}>
                  <SelectTrigger className="h-12 w-full bg-white" id="affiliate-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PDF_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="affiliate-button-text">Custom button text</Label>
                <Input
                  aria-invalid={Boolean(errors.buttonTitle)}
                  className="h-11 bg-white"
                  id="affiliate-button-text"
                  onChange={(event) => updateField("buttonTitle", event.target.value)}
                  placeholder="e.g. Shop now"
                  value={formData.buttonTitle}
                />
                {errors.buttonTitle && <p className="text-sm text-red-500">{errors.buttonTitle}</p>}
              </div>
            </div>
            <DrawerFooter className="border-t bg-white p-6 sm:flex-row sm:justify-end">
              <DrawerClose
                render={
                  <Button className="h-11" type="button" variant="outline">
                    Cancel
                  </Button>
                }
              />
              <Button className="h-11" type="submit">
                {isEditing ? "Update affiliate product" : "Save affiliate product"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      <AlertDialog open={Boolean(pendingThumbnail)} onOpenChange={(open) => !open && cancelPendingThumbnail()}>
        <AlertDialogContent className="max-w-md gap-6 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Upload thumbnail</AlertDialogTitle>
            <AlertDialogDescription>Review the selected image before adding it to this product.</AlertDialogDescription>
          </AlertDialogHeader>
          {pendingThumbnail && (
            <div className="overflow-hidden rounded-xl border bg-slate-100">
              <img
                alt="Selected thumbnail preview"
                className="h-48 w-full object-cover"
                src={pendingThumbnail.previewUrl}
              />
              <p className="truncate border-t bg-white px-3 py-2 text-center text-xs font-medium">
                {pendingThumbnail.file.name}
              </p>
            </div>
          )}
          <AlertDialogFooter className="-mx-6 -mb-6 px-6">
            <AlertDialogCancel className="h-12 px-6" onClick={cancelPendingThumbnail}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="h-12 min-w-36 px-6" disabled={isUploading} onClick={proceedWithThumbnail}>
              {isUploading ? (
                <>
                  <LoaderCircle className="animate-spin" /> Uploading...
                </>
              ) : (
                "Upload thumbnail"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default UploadAffiliateProductSidebar;

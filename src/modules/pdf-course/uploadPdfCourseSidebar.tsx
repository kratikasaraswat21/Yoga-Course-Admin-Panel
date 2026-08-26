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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { PDF_STATUSES } from "@/utils/constants/global.constants";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import type {
  MediaSignature,
  PdfCourseFormData,
  PdfCourseStatus,
  PendingUpload,
  uploadPdfCourseInterface,
} from "@/utils/interface/pdf-course.interface";
import { validatePdfCourseForm, validatePdfFile, validatePdfThumbnail } from "@/utils/validation/pdf-course.validation";
import axios from "axios";
import { FileText, FileUp, ImageUp, LoaderCircle, Percent, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";

function UploadPdfCourseSidebar({
  isDrawerOpen,
  errors,
  formData,
  isPdfDragging,
  isThumbnailDragging,
  isEditing = false,
  pendingUpload,
  thumbnailPreview,
  editCourseId,
  setErrors,
  setFormData,
  setPendingUpload,
  setThumbnailPreview,
  setIsThumbnailDragging,
  setIsPdfDragging,
  setIsDrawerOpen,
  reFetchThePdfCourseData,
}: uploadPdfCourseInterface) {
  const thumbnailPreviewRef = useRef("");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(
    () => () => {
      if (thumbnailPreviewRef.current) URL.revokeObjectURL(thumbnailPreviewRef.current);
    },
    [],
  );

  const updateField = (field: keyof PdfCourseFormData, value: PdfCourseFormData[keyof PdfCourseFormData]) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const isFree = formData.isAvailableForFree;
  const payableAmount = Math.max(0, formData.price - (formData.price * formData.discount) / 100);

  const updatePrice = (value: string) => {
    const price = Number(value) || 0;
    setFormData((current) => ({
      ...current,
      price,
      totalPayableAmount: Math.max(0, price - (price * current.discount) / 100),
    }));
    setErrors((current) => ({ ...current, price: undefined, totalPayableAmount: undefined }));
  };

  const updateDiscount = (value: string) => {
    const discount = Number(value) || 0;
    setFormData((current) => ({
      ...current,
      discount,
      totalPayableAmount: Math.max(0, current.price - (current.price * discount) / 100),
    }));
    setErrors((current) => ({ ...current, discount: undefined, totalPayableAmount: undefined }));
  };

  const toggleFreeCourse = () => {
    const nextIsFree = !isFree;
    setFormData((current) => ({
      ...current,
      isAvailableForFree: nextIsFree,
      totalPayableAmount: nextIsFree ? 0 : Math.max(0, current.price - (current.price * current.discount) / 100),
    }));
    setErrors((current) => ({ ...current, price: undefined, discount: undefined, totalPayableAmount: undefined }));
  };
  const selectThumbnail = (file?: File) => {
    if (!file) return;
    const thumbnailError = validatePdfThumbnail(file);
    if (thumbnailError) {
      setErrors((current) => ({ ...current, thumbnailName: thumbnailError }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setPendingUpload({ type: "thumbnail", file, previewUrl });
  };
  const selectPdf = (file?: File) => {
    if (!file) return;
    const pdfError = validatePdfFile(file);
    if (pdfError) {
      setErrors((current) => ({ ...current, pdfFileName: pdfError }));
      return;
    }
    setPendingUpload({ type: "pdf", file });
  };

  const cancelPendingUpload = () => {
    if (pendingUpload?.previewUrl) URL.revokeObjectURL(pendingUpload.previewUrl);
    setPendingUpload(null);
  };

  const uploadMediaToCloudinary = async (file: File, signingData: MediaSignature) => {
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", signingData.apiKey);
    body.append("timestamp", String(signingData.timestamp));
    body.append("signature", signingData.upload_info?.signature);
    if (signingData?.upload_info?.folder) body.append("folder", signingData.upload_info?.folder);

    const resourceType = signingData?.upload_info?.resourceType ?? (file.type === "application/pdf" ? "raw" : "image");
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signingData.cloudName}/${resourceType}/upload`,
      body,
    );

    const fileUrl = response.data.secure_url ?? response.data.url;
    if (!fileUrl) throw new Error(ERROR_MESSAGES.PDF_FILE_URL_MISSING);
    return fileUrl;
  };

  const getMediaFileSigned = async (payloadData: PendingUpload) => {
    const response = await multipleApiHandler([
      {
        endPoint:
          payloadData.type === "pdf" ? "pdf-course/cloud/pdf/signature" : "pdf-course/cloud/thumbnail/signature",
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

  const proceedWithUpload = async () => {
    if (!pendingUpload) return;
    setIsUploading(true);

    const uploadPromise = (async () => {
      const signingData = await getMediaFileSigned(pendingUpload);
      const fileUrl = await uploadMediaToCloudinary(pendingUpload.file, signingData);

      if (pendingUpload.type === "thumbnail" && pendingUpload.previewUrl) {
        if (thumbnailPreviewRef.current) URL.revokeObjectURL(thumbnailPreviewRef.current);
        thumbnailPreviewRef.current = pendingUpload.previewUrl;
        setThumbnailPreview(pendingUpload.previewUrl);
        updateField("thumbnailUrl", fileUrl);
      } else {
        updateField("pdfFileName", pendingUpload.file.name);
        updateField("fileUrl", fileUrl);
      }

      setPendingUpload(null);
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
  };

  const clearPdfSelection = () => updateField("pdfFileName", "");

  const clearThumbnailSelection = () => {
    if (thumbnailPreviewRef.current) URL.revokeObjectURL(thumbnailPreviewRef.current);
    thumbnailPreviewRef.current = "";
    setThumbnailPreview("");
    setFormData((pervData) => ({ ...pervData, thumbnailUrl: "" }));
  };

  const handlePdfDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsPdfDragging(false);
    selectPdf(event.dataTransfer.files?.[0]);
  };

  const handelAddPdfCourseApiCall = useDebounce(async (data: PdfCourseFormData) => {
    const response = await multipleApiHandler([
      {
        endPoint: isEditing ? `pdf-course/edit?id=${editCourseId}` : "pdf-course/add",
        data: data,
        protected: true,
        method: "POST",
      },
    ]);

    const res = response[0];
    toast.add({
      title: res?.data?.message ?? (res?.data?.success ? SUCCESS_MESSAGES.PDF_COURSE_SAVED : ERROR_MESSAGES.PDF_COURSE_SAVE_FAILED),
      positionerProps: {},
      type: res?.data?.success ? "success" : "error",
    });
    if (res?.data?.success) {
      setIsDrawerOpen(false);
      reFetchThePdfCourseData();
    }
    setLoading(false);
  }, 100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validatePdfCourseForm(formData);
    setErrors(validation.errors);
    if (!validation.isValid) return;
    setLoading(true);
    handelAddPdfCourseApiCall(formData);
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectThumbnail(event.target.files?.[0]);
  };

  const handleThumbnailDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsThumbnailDragging(false);
    selectThumbnail(event.dataTransfer.files?.[0]);
  };
  return (
    <>
      <Drawer onOpenChange={setIsDrawerOpen} open={isDrawerOpen} swipeDirection="right">
        <DrawerContent className="w-full sm:w-[min(100%,32rem)]">
          <DrawerHeader className="flex-row items-start justify-between border-b p-6 text-left">
            <div>
              <DrawerTitle className="text-xl">{isEditing ? "Edit PDF course" : "Add PDF course"}</DrawerTitle>
              <DrawerDescription className="mt-1">
                Add the PDF details and make it available in your content library.
              </DrawerDescription>
            </div>
            <DrawerClose
              render={
                <Button aria-label="Close drawer" className="-mr-2 -mt-2 shrink-0" size="icon" type="button">
                  <X />
                </Button>
              }
            />
          </DrawerHeader>
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="space-y-2">
                <Label htmlFor="pdf-title">Title</Label>
                <Input
                  aria-invalid={Boolean(errors.title)}
                  className="h-11 bg-white"
                  id="pdf-title"
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="e.g. Yoga Anatomy Essentials"
                  value={formData.title}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-description">Description</Label>
                <Textarea
                  aria-invalid={Boolean(errors.description)}
                  className="min-h-32 resize-y bg-white"
                  id="pdf-description"
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Describe what students will learn..."
                  value={formData.description}
                />
                {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF file</Label>
                {formData.pdfFileName ? (
                  <div className="group relative flex min-h-40 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-6">
                    <div className="flex min-w-0 flex-col items-center text-center">
                      <span className="flex size-12 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm ring-1 ring-slate-200">
                        <FileText className="size-6" />
                      </span>
                      <span className="mt-3 max-w-full truncate text-sm font-medium">{formData.pdfFileName}</span>
                      <span className="mt-1 text-xs text-slate-500">PDF file selected</span>
                    </div>
                    <button
                      aria-label="Remove selected PDF"
                      className="absolute top-3 right-3 cursor-pointer flex size-8 items-center justify-center rounded-full bg-white/95 text-slate-500 opacity-0 shadow-sm ring-1 ring-slate-200 transition-opacity hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      onClick={clearPdfSelection}
                      type="button">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="group relative">
                    <label
                      className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${isPdfDragging ? "border-slate-900 bg-slate-100" : "border-slate-300 bg-slate-50 hover:border-slate-500"}`}
                      htmlFor="pdf-file"
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsPdfDragging(true);
                      }}
                      onDragLeave={() => setIsPdfDragging(false)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handlePdfDrop}>
                      <span className="flex size-12 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm ring-1 ring-slate-200">
                        <FileUp className="size-6" />
                      </span>
                      <span className="mt-3 text-sm font-medium">Drag and drop your PDF here</span>
                      <span className="mt-1 text-xs text-slate-500">PDF only · or click to browse</span>
                    </label>
                  </div>
                )}
                <Input
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  id="pdf-file"
                  onClick={(event) => {
                    event.currentTarget.value = "";
                  }}
                  onChange={(e) => selectPdf(e.target.files?.[0])}
                  type="file"
                />
                {errors.fileUrl && <p className="text-sm text-red-500">{errors.fileUrl}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-thumbnail">Thumbnail</Label>
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
                      onClick={clearThumbnailSelection}
                      type="button">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="group relative">
                    <label
                      className={`relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed p-4 text-center transition ${isThumbnailDragging ? "border-slate-900 bg-slate-100" : "border-slate-300 bg-slate-50 hover:border-slate-500"}`}
                      htmlFor="pdf-thumbnail"
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setIsThumbnailDragging(true);
                      }}
                      onDragLeave={() => setIsThumbnailDragging(false)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleThumbnailDrop}>
                      <span className="flex size-12 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                        <ImageUp className="size-6" />
                      </span>
                      <span className="mt-3 text-sm font-medium">Drag and drop an image here</span>
                      <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WEBP · or click to browse</span>
                    </label>
                  </div>
                )}
                <Input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  id="pdf-thumbnail"
                  onClick={(event) => {
                    event.currentTarget.value = "";
                  }}
                  onChange={handleThumbnailChange}
                  type="file"
                />
                {errors.thumbnailUrl && <p className="text-sm text-red-500">{errors.thumbnailUrl}</p>}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label className="text-sm font-semibold" htmlFor="pdf-free-course">Available for free</Label>
                    <p className="mt-1 text-xs text-slate-500">Students can access this course without payment.</p>
                  </div>
                  <button
                    aria-checked={isFree}
                    aria-label="Make PDF course free"
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${isFree ? "bg-slate-900" : "bg-slate-300"}`}
                    id="pdf-free-course"
                    onClick={toggleFreeCourse}
                    role="switch"
                    type="button">
                    <span className={`absolute top-1 size-4 rounded-full bg-white transition-transform ${isFree ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pdf-price">Price</Label>
                  <Input aria-invalid={Boolean(errors.price)} className="h-11 bg-white" disabled={isFree} id="pdf-price" min="0" onChange={(e) => updatePrice(e.target.value)} type="number" value={formData.price || ""} />
                  {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-discount">Discount</Label>
                  <div className="relative">
                    <Input aria-invalid={Boolean(errors.discount)} className="h-11 bg-white pr-10" disabled={isFree} id="pdf-discount" max="100" min="0" onChange={(e) => updateDiscount(e.target.value)} step="0.01" type="number" value={formData.discount || ""} />
                    <Percent aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.discount && <p className="text-sm text-red-500">{errors.discount}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pdf-total-payable">Total payable</Label>
                  <Input aria-invalid={Boolean(errors.totalPayableAmount)} className="h-11 bg-slate-100" disabled id="pdf-total-payable" value={isFree ? 0 : payableAmount} />
                  {errors.totalPayableAmount && <p className="text-sm text-red-500">{errors.totalPayableAmount}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdf-status">Status</Label>
                <Select
                  onValueChange={(value) => updateField("status", value as PdfCourseStatus)}
                  value={formData.status}>
                  <SelectTrigger className="h-12 w-full bg-white" id="pdf-status">
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
            </div>
            <DrawerFooter className="border-t bg-white p-6 sm:flex-row sm:justify-end">
              <DrawerClose
                render={
                  <Button className="h-11" type="button" variant="outline">
                    Cancel
                  </Button>
                }
              />
              <Button className="h-11" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin" /> Saving...
                  </>
                ) : (
                  "Save PDF course"
                )}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={Boolean(pendingUpload)} onOpenChange={(open) => !open && cancelPendingUpload()}>
        <AlertDialogContent className="min-h-90 min-w-0 max-w-[calc(100%-2rem)] gap-6 overflow-hidden p-6 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className={"text-xl"}>
              {pendingUpload?.type === "thumbnail" ? "Upload thumbnail" : "Upload PDF"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Review the selected file before adding it to this PDF course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingUpload?.type === "thumbnail" && pendingUpload.previewUrl ? (
            <div className="overflow-hidden rounded-xl border bg-slate-100">
              <img
                alt="Selected thumbnail preview"
                className="h-48 w-full object-cover"
                src={pendingUpload.previewUrl}
              />
              <p className="truncate border-t bg-white px-3 py-2 text-center text-xs font-medium">
                {pendingUpload.file.name}
              </p>
            </div>
          ) : (
            <div className="flex min-w-0 max-w-full items-center gap-3 overflow-hidden rounded-xl border bg-slate-50 p-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-rose-500 shadow-sm ring-1 ring-slate-200">
                <FileText className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" title={pendingUpload?.file.name}>
                  {pendingUpload?.file.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">PDF file selected</p>
              </div>
            </div>
          )}
          <AlertDialogFooter className="-mx-6 -mb-6 flex-wrap px-6">
            <AlertDialogCancel className="h-12 px-6" onClick={cancelPendingUpload}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="h-12 min-w-44 px-6" disabled={isUploading} onClick={proceedWithUpload}>
              {isUploading ? (
                <>
                  <LoaderCircle className="animate-spin" /> Uploading...
                </>
              ) : (
                "Proceed to upload"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default UploadPdfCourseSidebar;

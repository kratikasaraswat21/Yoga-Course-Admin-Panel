import { CalendarClock, ImageUp, Info, Link2, ListOrdered, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";

import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler, type CommonDataFormat } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { EnvConfig } from "@/utils/config/envConfig";
import { calculatePayableAmount } from "@/utils/helper/course.helper";
import { isValidUrl } from "@/utils/helper/helper";
import { addDaysToDate, formatScheduleDate, getIstToday } from "@/utils/helper/ist-date.helper";
import { COURSE_SLUG_MAX_LENGTH, slugify } from "@/utils/helper/slug.helper";
import type { CloudflareImageUploadResponse } from "@/utils/interface/global.interface";
import {
  MAX_PRELAUNCH_DAYS,
  validatePrelaunchDetails,
  type AddCourseDetailsErrors,
} from "@/utils/validation/course.validation";
import type { AddCourseDetails } from "./add-course.types";

const normalizePriceInput = (value: string) => value.replace(/^0+(?=\d)/, "");

function CourseDetailsStep({
  details,
  errors: submitErrors,
  savedPrelaunchStartDate,
  courseId,
  onDetailsLoaded,
  onChange,
  onDismissInfo,
  showInfo,
  isEditing,
}: {
  details: AddCourseDetails;
  errors: AddCourseDetailsErrors;
  /** Start date already saved on the course; a prelaunch that has started may keep it. */
  savedPrelaunchStartDate: string;
  courseId: string;
  onDetailsLoaded: (details: AddCourseDetails) => void;
  onChange: (details: AddCourseDetails) => void;
  onDismissInfo: () => void;
  showInfo: boolean;
  isEditing: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const price = Math.max(0, Number(details.price) || 0);
  const discount = Math.min(100, Math.max(0, Number(details.discountPercentage) || 0));
  const discountAmount = (price * discount) / 100;
  const payable = details.roundPayableAmount ? Math.round(price - discountAmount) : price - discountAmount;
  const update = <Key extends keyof AddCourseDetails>(key: Key, value: AddCourseDetails[Key]) =>
    onChange({ ...details, [key]: value });
  const today = getIstToday();
  // Prelaunch problems show while typing; "required" errors from the save attempt are kept too.
  const errors: AddCourseDetailsErrors = {
    ...submitErrors,
    ...validatePrelaunchDetails(details, savedPrelaunchStartDate),
  };
  // A started prelaunch keeps its past start date selectable; otherwise past days are blocked.
  const minStartDate = savedPrelaunchStartDate && savedPrelaunchStartDate < today ? savedPrelaunchStartDate : today;
  const earliestEndDate = addDaysToDate(details.prelaunchStartDate || today, 1);
  const minEndDate = earliestEndDate > addDaysToDate(today, 1) ? earliestEndDate : addDaysToDate(today, 1);
  const maxEndDate = details.prelaunchStartDate
    ? addDaysToDate(details.prelaunchStartDate, MAX_PRELAUNCH_DAYS)
    : undefined;
  const prelaunchDiscount = Math.min(100, Math.max(0, Number(details.prelaunchDiscount) || 0));
  const prelaunchPayable = calculatePayableAmount(price, prelaunchDiscount, details.roundPayableAmount);

  // The URL follows the title until the admin edits it by hand.
  const updateTitle = (title: string) => {
    const slugFollowsTitle = !details.slug || details.slug === slugify(details.title);
    onChange({ ...details, title, slug: slugFollowsTitle ? slugify(title) : details.slug });
  };

  const togglePrelaunch = (enabled: boolean) =>
    onChange({
      ...details,
      prelaunchEnabled: enabled,
      // Turning the offer off clears its dates and discount.
      ...(enabled ? {} : { prelaunchStartDate: "", prelaunchEndDate: "", prelaunchDiscount: "" }),
    });

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => setThumbnail(event.target.files?.[0]);

  const fetchStepOneFormData = useDebounce(async (courseId: string) => {
    const response = await multipleApiHandler([
      {
        endPoint: `/course/fetch/course/step-one/${courseId}`,
        protected: true,
        method: "GET",
      },
    ]);
    const res = response[0];

    if (res?.data?.success && res.data.data) {
      const course = res.data.data.course ?? res.data.data;
      const fetchedDetails: AddCourseDetails = {
        slug: String(course.slug ?? ""),
        prelaunchEnabled: Boolean(course.prelaunchEnabled),
        prelaunchStartDate: String(course.prelaunchStartDate ?? ""),
        prelaunchEndDate: String(course.prelaunchEndDate ?? ""),
        prelaunchDiscount: course.prelaunchEnabled ? String(course.prelaunchDiscount ?? "") : "",
        sequentialUnlock: course.sequentialUnlock === true,
        description: String(course.description ?? ""),
        discountPercentage: String(course.discountPercentage ?? course.discount ?? "0"),
        price: String(course.price ?? "0"),
        roundPayableAmount: Boolean(course.roundPayableAmount ?? course.roundOff ?? false),
        thumbnailId: String(course.thumbnailId ?? ""),
        thumbnailURL: String(course.thumbnailURL ?? course.thumbnailUrl ?? ""),
        title: String(course.title ?? ""),
      };
      onDetailsLoaded(fetchedDetails);
    }
  }, 100);

  const setThumbnail = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedImage(file);
    onChange({ ...details, thumbnailURL: "", thumbnailId: "" });
  };

  const handleThumbnailDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    setThumbnail(event.dataTransfer.files?.[0]);
  };

  const handelRemoveThumbnailFunction = async (imageId: string) => {
    const response = await multipleApiHandler([
      {
        endPoint: `/course/cloud/thumbnail/${imageId}`,
        method: "DELETE",
        protected: true,
      },
    ]);

    const res = response[0];

    if (!res?.ok || !res.data?.success) {
      throw new Error(res?.data?.message ?? ERROR_MESSAGES.COURSE_THUMBNAIL_UPLOAD_URL_FAILED);
    }

    onChange({ ...details, thumbnailId: "", thumbnailURL: "" });
  };

  const removeThumbnail = () => {
    setSelectedImage(null);
    onChange({ ...details, thumbnailURL: "", thumbnailId: "" });

    if (details?.thumbnailId) handelRemoveThumbnailFunction(details?.thumbnailId);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadImageToCloudflare = ({
    selectedFile,
    uploadUrl,
    onProgress,
  }: {
    selectedFile: File;
    uploadUrl: string;
    onProgress?: (percentage: number) => void;
  }) => {
    return new Promise<CloudflareImageUploadResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open("POST", uploadUrl, true);

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const percentage = Math.round((event.loaded / event.total) * 100);

        onProgress?.(percentage);
      };

      xhr.onload = () => {
        try {
          const result = JSON.parse(xhr.responseText) as CloudflareImageUploadResponse;

          if (xhr.status >= 200 && xhr.status < 300 && result.success) {
            resolve(result);
            return;
          }

          reject(new Error(result.errors?.[0]?.message ?? ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION));
        } catch {
          reject(new Error(ERROR_MESSAGES.COURSE_THUMBNAIL_INVALID_RESPONSE));
        }
      };

      xhr.onerror = () => {
        reject(new Error(ERROR_MESSAGES.COURSE_THUMBNAIL_NETWORK_ERROR));
      };

      const formData = new FormData();

      formData.append("file", selectedFile);

      xhr.send(formData);
    });
  };

  const handelGetCloudflareUploadUrl = async (imageData: File): Promise<CommonDataFormat> => {
    const response = await multipleApiHandler([
      {
        endPoint: "/course/cloud/thumbnail/upload-url",
        method: "POST",
        protected: true,
        data: {
          fileName: imageData?.name,
          fileType: imageData?.type,
          fileSize: imageData?.size,
        },
      },
    ]);

    const res = response[0];

    if (!res?.ok || !res.data?.success || !res.data.data?.uploadUrl) {
      throw new Error(res?.data?.message ?? ERROR_MESSAGES.COURSE_THUMBNAIL_UPLOAD_URL_FAILED);
    }

    return res.data;
  };

  const handelCloudImageUpload = async () => {
    if (!selectedImage || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    const toastId = toast.add({
      title: SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_TITLE,
      description: `${SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_DESCRIPTION} 0%`,
      timeout: 0,
      type: "loading",
    });

    try {
      const response = await handelGetCloudflareUploadUrl(selectedImage);
      const cloudflareObject = await handleUploadImageToCloudflare({
        selectedFile: selectedImage,
        uploadUrl: response.data.uploadUrl,
        onProgress: (percentage) => {
          setUploadProgress(percentage);
          toast.update(toastId, {
            description: `${SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_DESCRIPTION} ${percentage}%`,
            timeout: 0,
            type: "loading",
          });
        },
      });

      const publicUrl = cloudflareObject.result?.variants?.[0];

      const publicImageId = cloudflareObject.result?.id;

      onChange({ ...details, thumbnailURL: publicUrl ?? "", thumbnailId: publicImageId ?? "" });

      setUploadProgress(100);

      toast.update(toastId, {
        description: SUCCESS_MESSAGES.MEDIA_UPLOAD_COMPLETE_DESCRIPTION,
        timeout: 5000,
        title: SUCCESS_MESSAGES.MEDIA_UPLOAD_COMPLETE_TITLE,
        type: "success",
      });
    } catch (error) {
      toast.update(toastId, {
        description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
        timeout: 5000,
        title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    (() => {
      if (!selectedImage) {
        setPreviewUrl("");
        return;
      }
      const url = URL.createObjectURL(selectedImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    })();
  }, [selectedImage]);

  useEffect(() => {
    const hasDetails = Object.entries(details).some(([key, value]) => {
      if (key === "price" || key === "discountPercentage") return Number(value) > 0;
      if (typeof value === "boolean") return value;
      return String(value).trim().length > 0;
    });

    if (courseId && !hasDetails) fetchStepOneFormData(courseId);
  }, [courseId, details, fetchStepOneFormData]);

  return (
    <>
      {showInfo && (
        <div className="border-b border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700 sm:px-6">
          <div className="mx-auto flex max-w-[1580px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="size-5 shrink-0" />
              <span>
                <strong>{isEditing ? "Update your course details." : "Let's create your first course."}</strong>{" "}
                {isEditing
                  ? "Make your changes and continue through the same course setup steps."
                  : "Start with the basic details—videos can be added next."}
              </span>
            </div>
            <button
              aria-label="Dismiss information"
              className="shrink-0 rounded-md p-1 text-blue-700 transition hover:bg-blue-100"
              onClick={onDismissInfo}
              type="button">
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-[1580px] items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)] lg:px-6 xl:gap-6">
        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-5 py-5 sm:px-6">
            <CardTitle className="text-base font-bold">Course details</CardTitle>
            <p className="text-sm text-slate-500">Add the course information and configure its price.</p>
          </CardHeader>
          <CardContent className="space-y-5 px-5 py-5 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="course-title">Course title</Label>
              <Input
                aria-invalid={Boolean(errors.title)}
                className="h-10 bg-white"
                id="course-title"
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="e.g. Foundations of Hatha Yoga"
                value={details.title}
              />
              {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-slug">Course page URL</Label>
              <div
                className={`flex h-10 items-center overflow-hidden rounded-lg border bg-white text-sm ${errors.slug ? "border-red-500" : "border-input"}`}>
                <span className="flex h-full shrink-0 items-center gap-1.5 border-r bg-slate-50 px-3 text-slate-500">
                  <Link2 className="size-4" />
                  <span className="hidden sm:inline">{EnvConfig.LANDING_SITE_URL.replace(/^https?:\/\//, "")}</span>
                  /courses/
                </span>
                <input
                  aria-invalid={Boolean(errors.slug)}
                  className="h-full min-w-0 flex-1 px-3 outline-none"
                  id="course-slug"
                  maxLength={COURSE_SLUG_MAX_LENGTH}
                  onBlur={(event) => update("slug", slugify(event.target.value))}
                  onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="foundations-of-hatha-yoga"
                  value={details.slug}
                />
              </div>
              {errors.slug ? (
                <p className="text-sm text-red-600">{errors.slug}</p>
              ) : (
                <p className="text-xs text-slate-500">
                  Used for the public course page, if you turn it on in the landing page step.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-description">Description</Label>
              <RichTextEditor
                className="bg-white"
                id="course-description"
                onChange={(value) => update("description", value)}
                placeholder="Describe what students will learn in this course..."
                value={details.description}
              />
              {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="course-price">Price (₹)</Label>
                <Input
                  aria-invalid={Boolean(errors.price)}
                  className="h-10 bg-white"
                  id="course-price"
                  min="0"
                  onChange={(event) => update("price", normalizePriceInput(event.target.value.replace(/[^\d.]/g, "")))}
                  type="number"
                  value={details.price}
                />
                {errors.price && <p className="text-sm text-red-600">{errors.price}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-discount">Discount (%)</Label>
                <Input
                  aria-invalid={Boolean(errors.discountPercentage)}
                  className="h-10 bg-white"
                  id="course-discount"
                  max="100"
                  min="0"
                  onChange={(event) => {
                    const value = event.target.value.replace(/[^\d.]/g, "");
                    update("discountPercentage", value === "" ? "" : String(Math.min(100, Number(value))));
                  }}
                  type="number"
                  value={details.discountPercentage}
                />
                {errors.discountPercentage && <p className="text-sm text-red-600">{errors.discountPercentage}</p>}
              </div>
            </div>
            <div className="rounded-xl border bg-slate-50/70 p-4 sm:p-5">
              <div className="grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-slate-500">Course price</p>
                  <p className="mt-1 font-semibold">₹{price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Discount</p>
                  <p className="mt-1 font-semibold text-emerald-700">- ₹{discountAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Total payable</p>
                  <p className="mt-1 font-semibold">₹{payable.toFixed(2)}</p>
                </div>
              </div>
              {errors.totalPayableAmount && <p className="mt-3 text-sm text-red-600">{errors.totalPayableAmount}</p>}
              <label
                className="mt-4 flex cursor-pointer items-start gap-3 border-t pt-4"
                htmlFor="round-payable-amount">
                <Checkbox
                  checked={details.roundPayableAmount}
                  id="round-payable-amount"
                  onCheckedChange={(checked) => update("roundPayableAmount", checked === true)}
                />
                <span>
                  <span className="block text-sm font-medium">Round off the total payable amount</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Rounds the final amount to the nearest whole rupee.
                  </span>
                </span>
              </label>
            </div>
            <div className="rounded-xl border p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-3" htmlFor="sequential-unlock">
                <Checkbox
                  checked={details.sequentialUnlock}
                  id="sequential-unlock"
                  onCheckedChange={(checked) => update("sequentialUnlock", checked === true)}
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <ListOrdered className="size-4 text-slate-500" /> Lock videos in order
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Buyers must complete each video before the next one opens. Videos they have already watched always
                    stay open. You can change this at any time.
                  </span>
                </span>
              </label>
            </div>
            <div className="rounded-xl border p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-3" htmlFor="prelaunch-enabled">
                <Checkbox
                  checked={details.prelaunchEnabled}
                  id="prelaunch-enabled"
                  onCheckedChange={(checked) => togglePrelaunch(checked === true)}
                />
                <span>
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <CalendarClock className="size-4 text-slate-500" /> Enable prelaunch offer
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Optional. Sell the course at a special price for a limited time. During the offer the prelaunch
                    discount replaces the normal discount.
                  </span>
                </span>
              </label>
              {details.prelaunchEnabled && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="prelaunch-start-date">Start date</Label>
                      <Input
                        aria-invalid={Boolean(errors.prelaunchStartDate)}
                        className="h-10 bg-white"
                        id="prelaunch-start-date"
                        min={minStartDate}
                        onChange={(event) => update("prelaunchStartDate", event.target.value)}
                        type="date"
                        value={details.prelaunchStartDate}
                      />
                      {errors.prelaunchStartDate && <p className="text-sm text-red-600">{errors.prelaunchStartDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prelaunch-end-date">End date</Label>
                      <Input
                        aria-invalid={Boolean(errors.prelaunchEndDate)}
                        className="h-10 bg-white"
                        id="prelaunch-end-date"
                        max={maxEndDate}
                        min={minEndDate}
                        onChange={(event) => update("prelaunchEndDate", event.target.value)}
                        type="date"
                        value={details.prelaunchEndDate}
                      />
                      {errors.prelaunchEndDate && <p className="text-sm text-red-600">{errors.prelaunchEndDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prelaunch-discount">Prelaunch discount (%)</Label>
                      <Input
                        aria-invalid={Boolean(errors.prelaunchDiscount)}
                        className="h-10 bg-white"
                        id="prelaunch-discount"
                        max="100"
                        min="0"
                        onChange={(event) => {
                          const value = event.target.value.replace(/[^\d.]/g, "");
                          update("prelaunchDiscount", value === "" ? "" : String(Math.min(100, Number(value))));
                        }}
                        type="number"
                        value={details.prelaunchDiscount}
                      />
                      {errors.prelaunchDiscount && <p className="text-sm text-red-600">{errors.prelaunchDiscount}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Both dates switch at 12:00 AM IST. The offer can run for up to {MAX_PRELAUNCH_DAYS} days, from the
                    start date until the end date begins
                    {details.prelaunchStartDate &&
                    details.prelaunchEndDate &&
                    details.prelaunchEndDate > details.prelaunchStartDate
                      ? ` (${formatScheduleDate(details.prelaunchStartDate)}, 12:00 AM to ${formatScheduleDate(details.prelaunchEndDate)}, 12:00 AM).`
                      : "."}
                  </p>
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 text-sm">
                    <span className="text-amber-900">Prelaunch payable amount</span>
                    <strong className="text-amber-950">₹{prelaunchPayable.toFixed(2)}</strong>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="border-b px-5 py-5 sm:px-6">
            <CardTitle className="text-base font-bold">Course thumbnail</CardTitle>
            <p className="text-sm text-slate-500">Upload the cover shown across the platform.</p>
          </CardHeader>
          <CardContent className="px-5 py-5 sm:px-6">
            <div
              className={`relative flex min-h-76.25 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-400 p-6 text-center transition ${isDragging ? "border-blue-500 bg-blue-50" : "bg-slate-50/40"}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleThumbnailDrop}>
              {selectedImage || isValidUrl(details?.thumbnailURL) ? (
                <img
                  alt="Course thumbnail preview"
                  className="absolute left-1/2 top-1/2 h-auto max-h-[500px] w-[600px] max-w-full -translate-x-1/2 -translate-y-1/2 object-contain"
                  src={previewUrl || details?.thumbnailURL}
                />
              ) : (
                <>
                  <span className="flex size-12 items-center justify-center rounded-full border bg-white text-slate-700">
                    <ImageUp className="size-6" />
                  </span>
                  <p className="mt-4 text-sm font-bold">Upload course thumbnail</p>
                  <p className="mt-1 text-sm text-slate-500">PNG, JPG or WebP · recommended 16:9</p>
                </>
              )}
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleThumbnailChange}
                ref={fileInputRef}
                type="file"
              />
              {!(selectedImage || isValidUrl(details?.thumbnailURL)) && (
                <Button
                  className={`relative z-10 h-10 mt-5 bg-white text-slate-900 shadow-none ring-1 ring-slate-200 hover:bg-slate-100`}
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  variant="outline">
                  Choose file
                </Button>
              )}
              {(selectedImage || isValidUrl(details?.thumbnailURL)) && (
                <button
                  aria-label="Remove course thumbnail"
                  className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-slate-950/90 text-white transition hover:bg-slate-950"
                  onClick={removeThumbnail}
                  disabled={isUploading}
                  type="button">
                  <X className="size-4" />
                </button>
              )}
              {errors.thumbnailURL && <p className="mt-2 text-sm text-red-600">{errors.thumbnailURL}</p>}
            </div>
            {(selectedImage || isValidUrl(details?.thumbnailURL)) && (
              <>
                {details?.thumbnailId?.length !== 0 ? (
                  <Button className="mt-4 h-11 w-full" onClick={removeThumbnail} type="button" variant="default">
                    Discard Image
                  </Button>
                ) : (
                  <Button
                    className="mt-4 h-11 w-full"
                    disabled={isUploading || Boolean(details.thumbnailURL)}
                    onClick={handelCloudImageUpload}
                    type="button"
                    variant="default">
                    {isUploading && <LoaderCircle className="animate-spin" />}
                    {isUploading
                      ? `Uploading ${uploadProgress}%`
                      : details.thumbnailURL
                        ? "Uploaded"
                        : "Confirm and upload"}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default CourseDetailsStep;

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/rich-text-editor";
import { toast } from "@/components/ui/variants/toast.manager";
import { multipleApiHandler, type CommonDataFormat } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { addDaysToDate, formatScheduleDate, getIstToday } from "@/utils/helper/ist-date.helper";
import type { CloudflareImageUploadResponse } from "@/utils/interface/global.interface";
import {
  MAX_VIDEO_RELEASE_DAYS_AHEAD,
  validateCourseVideoConfiguration,
  validateCourseVideoThumbnail,
  type CourseVideoConfigurationErrors,
} from "@/utils/validation/course-video.validation";
import { CalendarClock, FileVideo2, ImageUp, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import * as tus from "tus-js-client";
import type { CourseVideoConfiguration, CourseVideoFormData, CourseVideoGroup } from "./add-course.types";

interface ConfigureVideoDialogProps {
  courseId: string;
  configuration: CourseVideoConfiguration | null;
  onClose: () => void;
  onConfirm: (configuration: CourseVideoConfiguration) => void;
  fetchVideos: () => void;
  /** The course's weeks/groups; empty when the course doesn't use groups. */
  groups?: CourseVideoGroup[];
}

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} sec`;

function ConfigureVideoDialog({
  courseId,
  configuration,
  onClose,
  onConfirm,
  fetchVideos,
  groups = [],
}: ConfigureVideoDialogProps) {
  const isEditing = Boolean(configuration?.videoId);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CourseVideoFormData>(() => ({
    description: configuration?.formData.description ?? "",
    thumbnailFile: undefined,
    thumbnailType: configuration?.formData.thumbnailType ?? "custom",
    thumbnailUrl: configuration?.formData.thumbnailUrl ?? "",
    thumbnailId: configuration?.formData.thumbnailId ?? "",
    title: configuration?.formData.title ?? configuration?.file.name.replace(/\.[^/.]+$/, "") ?? "",
    releaseDate: configuration?.formData.releaseDate ?? "",
    groupId: configuration?.formData.groupId ?? "",
  }));
  const today = getIstToday();
  // The release date saved on the video being edited ("" for a new upload or no date).
  const savedReleaseDate = isEditing ? (configuration?.formData.releaseDate ?? "") : "";
  const isCurrentlyReleased = !savedReleaseDate || savedReleaseDate <= today;
  // Moving a video that buyers can already watch to a future date takes it away until then.
  const isRelockingReleasedVideo = isEditing && isCurrentlyReleased && formData.releaseDate > today;
  const [hasConfirmedRelock, setHasConfirmedRelock] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingThumbnail, setIsDeletingThumbnail] = useState(false);
  const [errors, setErrors] = useState<CourseVideoConfigurationErrors>({});
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const thumbnailPreview = useMemo(
    () => (formData.thumbnailFile ? URL.createObjectURL(formData.thumbnailFile) : formData.thumbnailUrl),
    [formData.thumbnailFile, formData.thumbnailUrl],
  );

  useEffect(() => {
    return () => {
      if (formData.thumbnailFile && thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [formData.thumbnailFile, thumbnailPreview]);

  const updateFormData = <Field extends keyof CourseVideoFormData>(field: Field, value: CourseVideoFormData[Field]) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const selectThumbnail = (file?: File) => {
    if (!file) return;
    const thumbnailError = validateCourseVideoThumbnail(file);
    if (thumbnailError) {
      setErrors((current) => ({ ...current, thumbnailFile: thumbnailError }));
      return;
    }
    setFormData((current) => ({
      ...current,
      thumbnailFile: file,
      thumbnailType: "custom",
      thumbnailUrl: "",
      thumbnailId: "",
    }));
    setErrors((current) => ({ ...current, thumbnailFile: undefined }));
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectThumbnail(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleThumbnailDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsThumbnailDragging(false);
    selectThumbnail(event.dataTransfer.files?.[0]);
  };

  const handelRemoveThumbnailFunction = async (imageId: string) => {
    setIsDeletingThumbnail(true);
    try {
      const response = await multipleApiHandler([
        {
          endPoint: `/course/cloud/thumbnail/${imageId}`,
          method: "DELETE",
          protected: true,
        },
      ]);

      const res = response[0];

      if (!res?.ok || !res.data?.success) {
        setFormData((current) => ({ ...current, thumbnailFile: undefined, thumbnailUrl: "", thumbnailId: "" }));
        throw new Error(res?.data?.message ?? "The thumbnail could not be deleted.");
      }

      setFormData((current) => ({ ...current, thumbnailFile: undefined, thumbnailUrl: "", thumbnailId: "" }));
      toast.add({
        description: res.data.message ?? "The thumbnail was deleted successfully.",
        title: "Thumbnail deleted",
        type: "success",
      });
    } catch (error) {
      toast.add({
        description: error instanceof Error ? error.message : "The thumbnail could not be deleted.",
        title: "Thumbnail deletion failed",
        type: "error",
      });
    } finally {
      setIsDeletingThumbnail(false);
    }
  };

  const removeThumbnail = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (formData?.thumbnailId) {
      void handelRemoveThumbnailFunction(formData.thumbnailId);
    } else {
      setFormData((current) => ({ ...current, thumbnailFile: undefined }));
    }

    setErrors((current) => ({ ...current, thumbnailFile: undefined }));
  };

  const getCloudFlairVideoUploadationUrl = async () => {
    if (!courseId || !configuration?.file) return null;

    const file = configuration.file;

    const response = await multipleApiHandler([
      {
        endPoint: "/uploads/videos/upload-url",
        protected: true,
        method: "POST",
        data: {
          courseId,
          title: formData.title,
          description: formData.description,

          // Keep the original filename unless your backend requires no extension
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          maxDurationSeconds: configuration.durationSeconds,
          thumbnailType: formData.thumbnailType,
          thumbnailUrl: formData.thumbnailUrl,
          thumbnailId: formData.thumbnailId,
          ...(formData.releaseDate ? { releaseDate: formData.releaseDate } : {}),
          ...(formData.groupId ? { groupId: formData.groupId } : {}),
        },
      },
    ]);

    const res = response[0];

    if (!res?.data?.success) {
      throw new Error(res?.data?.message || "Unable to create video upload URL");
    }

    return res.data.data;
  };

  const uploadVideoToCloudflareWithTUS = (
    file: File,
    uploadUrl: string,
    onProgress?: (percentage: number) => void,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        uploadUrl,

        retryDelays: [0, 3000, 5000, 10000, 20000],

        // 50 MB; must be divisible by 256 KiB
        chunkSize: 50 * 1024 * 1024,

        metadata: {
          filename: file.name,
          filetype: file.type,
        },

        onError(error) {
          console.error("Cloudflare video upload failed:", error);
          reject(error);
        },

        onProgress(bytesUploaded, bytesTotal) {
          const percentage = Math.round((bytesUploaded / bytesTotal) * 100);

          onProgress?.(percentage);
        },

        onSuccess() {
          console.log("Video successfully uploaded to Cloudflare Stream");
          resolve();
        },
      });

      upload.start();
    });
  };

  const handleProceedVideoUploadation = async () => {
    if (!configuration?.file) return;

    const toastId = toast.add({
      data: { hideClose: true },
      description: "Preparing your video upload... 0%",
      timeout: 0,
      title: "Uploading video",
      type: "loading",
    });

    onClose();

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const uploadData = await getCloudFlairVideoUploadationUrl();

      if (!uploadData?.uploadUrl) {
        throw new Error("Cloudflare upload URL was not returned");
      }

      await uploadVideoToCloudflareWithTUS(configuration.file, uploadData.uploadUrl, (percentage) => {
        setUploadProgress(percentage);
        toast.update(toastId, {
          data: { hideClose: true },
          description: `Uploading your video... ${percentage}%`,
          timeout: 0,
          type: "loading",
        });
      });

      setUploadProgress(100);
      fetchVideos();
      toast.update(toastId, {
        data: { hideClose: true },
        description: "Your video was uploaded successfully.",
        timeout: 5000,
        title: "Video upload complete",
        type: "success",
      });
      onConfirm({ ...configuration, formData });
    } catch (error) {
      toast.update(toastId, {
        data: { hideClose: true },
        description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
        timeout: 5000,
        title: ERROR_MESSAGES.COURSE_VIDEO_UPLOAD_FAILED_TITLE,
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateVideo = async () => {
    if (!configuration?.videoId) return;

    setIsUploading(true);
    try {
      const response = await multipleApiHandler([
        {
          endPoint: `/uploads/videos/edit`,
          method: "PUT",
          protected: true,
          data: {
            videoId: configuration.videoId,
            title: formData.title,
            description: formData.description,
            thumbnailUrl: formData.thumbnailUrl,
            thumbnailId: formData.thumbnailId,
            // "" clears the release date, so the video is visible straight away.
            releaseDate: formData.releaseDate,
            // "" removes the video from its group.
            groupId: formData.groupId,
          },
        },
      ]);
      const result = response[0];

      toast.add({
        description:
          result?.data?.message ??
          (result?.data?.success ? "The video was updated successfully." : "The video could not be updated."),
        title: result?.data?.success ? "Video updated" : "Video update failed",
        type: result?.data?.success ? "success" : "error",
      });

      if (result?.data?.success) {
        fetchVideos();
        onConfirm({ ...configuration, formData });
        onClose();
      }
    } catch (error) {
      toast.add({
        description: error instanceof Error ? error.message : "The video could not be updated.",
        title: "Video update failed",
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };
  const handleConfirm = () => {
    if (!configuration) return;
    const nextConfiguration = { ...configuration, formData };
    const validation = validateCourseVideoConfiguration(nextConfiguration, savedReleaseDate);
    setErrors(validation.errors);
    if (!validation.isValid) return;
    if (isRelockingReleasedVideo && !hasConfirmedRelock) {
      setHasConfirmedRelock(true);
      return;
    }
    if (isEditing) {
      handleUpdateVideo();
    } else {
      handleProceedVideoUploadation();
    }
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

  const handelUploadVideoThumbnail = async () => {
    if (!formData.thumbnailFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const toastId = toast.add({
      title: SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_TITLE,
      description: `${SUCCESS_MESSAGES.MEDIA_UPLOAD_LOADING_DESCRIPTION} 0%`,
      timeout: 0,
      type: "loading",
    });
    try {
      const response = await handelGetCloudflareUploadUrl(formData.thumbnailFile);
      const cloudflareObject = await handleUploadImageToCloudflare({
        selectedFile: formData.thumbnailFile,
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

      setFormData((current) => ({
        ...current,
        thumbnailFile: undefined,
        thumbnailUrl: publicUrl ?? "",
        thumbnailId: publicImageId ?? "",
      }));

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

  return (
    <AlertDialog onOpenChange={(open) => !open && onClose()} open={Boolean(configuration)}>
      <AlertDialogContent
        className="relative flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-hidden p-0"
        style={{
          maxWidth: "850px",
          position: "fixed",
        }}>
        <AlertDialogHeader className="text-left">
          <div className="w-full flex items-center justify-between p-6 border-b">
            <div className="flex flex-col items-start justify-start gap-2">
              <AlertDialogTitle className="pr-10 text-xl xl:text-2xl font-bold">
                {isEditing ? "Update video configuration" : "Configure video"}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                {isEditing ? "Update the video details." : "Add the video details before starting the upload."}
              </AlertDialogDescription>
            </div>
            <Button
              aria-label="Close configure video dialog"
              className="rounded-md w-10 h-10"
              disabled={isUploading || isDeletingThumbnail}
              onClick={onClose}
              type="button"
              variant="default">
              <X className="size-5" />
            </Button>
          </div>
        </AlertDialogHeader>
        {configuration && (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid gap-5 p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="video-title">Video title</Label>
                  <Input
                    aria-invalid={Boolean(errors.title)}
                    id="video-title"
                    onChange={(event) => updateFormData("title", event.target.value)}
                    value={formData.title}
                  />
                  {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
                </div>
                {groups.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="video-group">Week / group</Label>
                    <select
                      className="h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      id="video-group"
                      onChange={(event) => updateFormData("groupId", event.target.value)}
                      value={formData.groupId}>
                      <option value="">No group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="video-release-date">Release date (optional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-invalid={Boolean(errors.releaseDate)}
                      id="video-release-date"
                      max={addDaysToDate(today, MAX_VIDEO_RELEASE_DAYS_AHEAD)}
                      min={savedReleaseDate && savedReleaseDate < today ? savedReleaseDate : today}
                      onChange={(event) => {
                        updateFormData("releaseDate", event.target.value);
                        setErrors((current) => ({ ...current, releaseDate: undefined }));
                        setHasConfirmedRelock(false);
                      }}
                      type="date"
                      value={formData.releaseDate}
                    />
                    {formData.releaseDate && (
                      <Button
                        className="h-9 shrink-0"
                        onClick={() => {
                          updateFormData("releaseDate", "");
                          setErrors((current) => ({ ...current, releaseDate: undefined }));
                          setHasConfirmedRelock(false);
                        }}
                        type="button"
                        variant="outline">
                        Clear
                      </Button>
                    )}
                  </div>
                  {errors.releaseDate ? (
                    <p className="text-sm text-red-600">{errors.releaseDate}</p>
                  ) : (
                    <p className="flex items-start gap-1.5 text-xs text-slate-500">
                      <CalendarClock className="mt-px size-3.5 shrink-0" />
                      {formData.releaseDate && formData.releaseDate > today
                        ? `Buyers can watch it from ${formatScheduleDate(formData.releaseDate)}, 12:00 AM IST.`
                        : `Leave empty (or pick today) to show it as soon as processing finishes. Up to ${MAX_VIDEO_RELEASE_DAYS_AHEAD} days ahead.`}
                    </p>
                  )}
                  {isRelockingReleasedVideo && hasConfirmedRelock && (
                    <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                      Buyers who can watch this video now will lose access to it until{" "}
                      {formatScheduleDate(formData.releaseDate)}. Click &quot;Confirm update&quot; to continue.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video-description">Description (optional)</Label>
                  <RichTextEditor
                    id="video-description"
                    minHeight="min-h-40"
                    onChange={(value) => updateFormData("description", value)}
                    placeholder="Add a description for this video..."
                    value={formData.description}
                  />
                </div>
                {!isEditing && (
                  <Card className="gap-0 overflow-hidden rounded-2xl bg-gray-100/10 p-0 shadow-sm ring-0 border border-slate-400">
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-200/80 px-4 py-3 text-sm font-semibold text-slate-950">
                      <span className="flex size-7 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                        <FileVideo2 className="size-4" />
                      </span>
                      <span>Video file details</span>
                    </div>
                    <dl className="space-y-2 px-4 py-3 text-sm leading-5">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <dt className="text-[#526b91]">File name</dt>
                        <dd className="max-w-58.75 truncate text-right text-slate-950">{configuration.file.name}</dd>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <dt className="text-[#526b91]">File type</dt>
                        <dd className="text-right text-slate-950">
                          {configuration.file.type.split("/")[1]?.toUpperCase()}
                        </dd>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <dt className="text-[#526b91]">File size</dt>
                        <dd className="text-right text-slate-950">{formatFileSize(configuration.file.size)}</dd>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <dt className="text-[#526b91]">Duration</dt>
                        <dd className="text-right text-slate-950">{formatDuration(configuration.durationSeconds)}</dd>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                        <dt className="text-[#526b91]">Total duration (seconds)</dt>
                        <dd className="text-right text-slate-950">{Math.round(configuration.durationSeconds)}</dd>
                      </div>
                    </dl>
                  </Card>
                )}
              </div>
              <div className="space-y-3">
                <Label>Thumbnail</Label>
                <div className="rounded-xl border border-slate-800 p-4">
                  <span className="text-sm font-medium">Custom thumbnail</span>
                  <div
                    className={`relative mt-3 flex min-h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed p-4 text-center transition ${isThumbnailDragging ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-50/40"}`}
                    onClick={() => thumbnailInputRef.current?.click()}
                    onDragEnter={(event) => {
                      event.preventDefault();
                      setIsThumbnailDragging(true);
                    }}
                    onDragLeave={() => setIsThumbnailDragging(false)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleThumbnailDrop}
                    role="button"
                    tabIndex={0}>
                    {thumbnailPreview ? (
                      <img
                        alt="Video thumbnail preview"
                        className="size-full max-h-40 object-cover rounded"
                        src={thumbnailPreview}
                      />
                    ) : (
                      <>
                        <ImageUp className="size-7 text-slate-600" />
                        <span className="mt-3 text-sm font-semibold">Upload thumbnail</span>
                        <span className="mt-1 text-xs text-slate-500">PNG, JPG, or WebP · recommended 16:9</span>
                      </>
                    )}
                    {thumbnailPreview && (
                      <button
                        aria-label="Remove video thumbnail"
                        className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-slate-950/90 text-white hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isDeletingThumbnail || isUploading}
                        onClick={removeThumbnail}
                        type="button">
                        <X className="size-4" />
                      </button>
                    )}
                    {!thumbnailPreview && (
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={handleThumbnailChange}
                        ref={thumbnailInputRef}
                        type="file"
                      />
                    )}
                  </div>
                  {(thumbnailPreview || formData?.thumbnailUrl) && (
                    <>
                      {formData?.thumbnailId?.length !== 0 ? (
                        <Button
                          className="mt-4 h-11 w-full"
                          disabled={isDeletingThumbnail || isUploading}
                          onClick={removeThumbnail}
                          type="button"
                          variant="default">
                          {isDeletingThumbnail ? "Deleting image..." : "Discard Image"}
                        </Button>
                      ) : (
                        <Button
                          className="mt-4 h-11 w-full"
                          disabled={isUploading || Boolean(formData.thumbnailUrl)}
                          onClick={handelUploadVideoThumbnail}
                          type="button"
                          variant="default">
                          {isUploading && <LoaderCircle className="animate-spin" />}
                          {isUploading
                            ? `Uploading ${uploadProgress}%`
                            : formData.thumbnailUrl
                              ? "Uploaded"
                              : "Confirm and upload"}
                        </Button>
                      )}
                    </>
                  )}
                  {errors.thumbnailFile && <p className="mt-2 text-sm text-red-600">{errors.thumbnailFile}</p>}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="shrink-0 p-6 pt-0">
          <AlertDialogFooter className="-mx-6 -mb-6 flex-row justify-end gap-3 border-t p-5">
            <Button
              className="h-11 px-6"
              disabled={isUploading || isDeletingThumbnail}
              onClick={onClose}
              type="button"
              variant="outline">
              Cancel
            </Button>
            <AlertDialogAction className="h-11 px-6" disabled={isUploading} onClick={handleConfirm}>
              {isEditing
                ? isRelockingReleasedVideo && hasConfirmedRelock
                  ? "Confirm update"
                  : "Update"
                : "Proceed to upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfigureVideoDialog;

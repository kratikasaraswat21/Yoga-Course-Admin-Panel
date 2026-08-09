import { FileVideo2, ImageUp, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import {
  validateCourseVideoConfiguration,
  validateCourseVideoThumbnail,
  type CourseVideoConfigurationErrors,
} from "@/utils/validation/course-video.validation";
import type { CourseVideoConfiguration, CourseVideoFormData } from "./add-course.types";

interface ConfigureVideoDialogProps {
  configuration: CourseVideoConfiguration | null;
  onClose: () => void;
  onConfirm: (configuration: CourseVideoConfiguration) => void;
}

const formatFileSize = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const formatDuration = (seconds: number) => `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} sec`;

function ConfigureVideoDialog({ configuration, onClose, onConfirm }: ConfigureVideoDialogProps) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<CourseVideoFormData>(() => ({
    description: "",
    thumbnailFile: undefined,
    thumbnailType: "automatic",
    thumbnailUrl: "",
    thumbnailUrlId: "",
    title: configuration?.file.name.replace(/\.[^/.]+$/, "") ?? "",
  }));
  const [isThumbnailConfirmed, setIsThumbnailConfirmed] = useState(false);
  const [errors, setErrors] = useState<CourseVideoConfigurationErrors>({});
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
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
      thumbnailUrlId: "",
    }));
    setIsThumbnailConfirmed(false);
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

  const removeThumbnail = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setFormData((current) => ({ ...current, thumbnailFile: undefined, thumbnailUrl: "", thumbnailUrlId: "" }));
    setIsThumbnailConfirmed(false);
    setErrors((current) => ({ ...current, thumbnailFile: undefined }));
  };

  const handleConfirm = () => {
    if (!configuration) return;
    const nextConfiguration = { ...configuration, formData };
    const validation = validateCourseVideoConfiguration(nextConfiguration);
    setErrors(validation.errors);
    if (validation.isValid) onConfirm(nextConfiguration);
  };

  return (
    <AlertDialog onOpenChange={(open) => !open && onClose()} open={Boolean(configuration)}>
      <AlertDialogContent
        className="relative gap-5 p-0"
        style={{
          maxWidth: "850px",
          overflowY: "auto",
          position: "fixed",
        }}>
        <AlertDialogHeader className="text-left">
          <div className="w-full flex items-center justify-between p-6 border-b">
            <div className="flex flex-col items-start justify-start gap-2">
              <AlertDialogTitle className="pr-10 text-xl xl:text-2xl font-bold">Configure video</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Add the video details before starting the upload.
              </AlertDialogDescription>
            </div>
            <Button
              aria-label="Close configure video dialog"
              className="rounded-md w-10 h-10"
              onClick={onClose}
              type="button"
              variant="default">
              <X className="size-5" />
            </Button>
          </div>
        </AlertDialogHeader>
        {configuration && (
          <div className="grid gap-5 lg:grid-cols-2 p-6">
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
              <div className="space-y-2">
                <Label htmlFor="video-description">Description (optional)</Label>
                <Textarea
                  className="min-h-40 resize-y"
                  id="video-description"
                  onChange={(event) => updateFormData("description", event.target.value)}
                  value={formData.description}
                />
              </div>
              <Card className="gap-3 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileVideo2 className="size-4" />
                  Video file details
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">File name</dt>
                    <dd className="max-w-[65%] truncate text-right">{configuration.file.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">File type</dt>
                    <dd className="text-right">{configuration.file.type.split("/")[1]?.toUpperCase()}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">File size</dt>
                    <dd className="text-right">{formatFileSize(configuration.file.size)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Duration</dt>
                    <dd className="text-right">{formatDuration(configuration.durationSeconds)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Total duration (seconds)</dt>
                    <dd className="text-right">{Math.round(configuration.durationSeconds)}</dd>
                  </div>
                </dl>
              </Card>
            </div>
            <div className="space-y-3">
              <Label>Thumbnail</Label>
              <label
                className={`block cursor-pointer rounded-xl border p-4 ${formData.thumbnailType === "automatic" ? "border-slate-800" : "border-slate-200"}`}>
                <input
                  checked={formData.thumbnailType === "automatic"}
                  className="sr-only"
                  name="video-thumbnail-mode"
                  onChange={() => {
                    setFormData((current) => ({
                      ...current,
                      thumbnailFile: undefined,
                      thumbnailType: "automatic",
                      thumbnailUrl: "",
                      thumbnailUrlId: "",
                    }));
                    setIsThumbnailConfirmed(false);
                    setErrors((current) => ({ ...current, thumbnailFile: undefined }));
                  }}
                  type="radio"
                />
                <span className="flex items-center gap-2 text-sm font-medium">
                  <span className="flex size-4 items-center justify-center rounded-full border border-slate-800">
                    {formData.thumbnailType === "automatic" && <span className="size-2 rounded-full bg-slate-800" />}
                  </span>
                  Automatic
                </span>
                <span className="mt-3 block pl-6 text-xs text-slate-500">
                  A thumbnail will be generated automatically from the video.
                </span>
              </label>
              <div
                className={`rounded-xl border p-4 ${formData.thumbnailType === "custom" ? "border-slate-800" : "border-slate-200"}`}>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    checked={formData.thumbnailType === "custom"}
                    className="size-4"
                    name="video-thumbnail-mode"
                    onChange={() => updateFormData("thumbnailType", "custom")}
                    type="radio"
                  />
                  Custom
                </label>
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
                      className="absolute top-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-slate-950/90 text-white hover:bg-slate-950"
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
                {thumbnailPreview && (
                  <Button className="mt-4 h-11 w-full" onClick={() => setIsThumbnailConfirmed(true)} type="button">
                    {isThumbnailConfirmed ? "Uploaded" : "Confirm and upload"}
                  </Button>
                )}
                {errors.thumbnailFile && <p className="mt-2 text-sm text-red-600">{errors.thumbnailFile}</p>}
              </div>
            </div>
          </div>
        )}
        <div className="p-6 pt-0">
          <AlertDialogFooter className="-mx-6 -mb-6 flex-row justify-end gap-3 border-t p-5">
            <Button className="h-11 px-6" onClick={onClose} type="button" variant="outline">
              Cancel
            </Button>
            <AlertDialogAction className="h-11 px-6" onClick={handleConfirm}>
              Proceed to upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default ConfigureVideoDialog;

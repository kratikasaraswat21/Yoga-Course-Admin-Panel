import { FileVideo2, ImageUp, UploadCloud, Video } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EMPTY_COURSE_FORM } from "@/utils/constants/course.constants";
import {
  calculatePayableAmount,
  convertCourseToFormData,
  formatCoursePrice,
  normalizeNonNegativeDecimalInput,
} from "@/utils/helper/course.helper";
import type { Course, CourseFormData, CourseFormErrors, VideoThumbnailMode } from "@/utils/interface/course.interface";
import { validateCourseForm } from "@/utils/validation/course.validation";

interface CourseFormProps {
  course: Course | null;
  onCancel: () => void;
  onSubmit: (formData: CourseFormData) => void;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm font-light text-red-500">{message}</p> : null;
}

function UploadDropZone({
  accept,
  description,
  fileName,
  icon: UploadIcon,
  id,
  label,
  onChange,
}: {
  accept: string;
  description: string;
  fileName: string;
  icon: typeof ImageUp;
  id: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <label
        className="flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center transition hover:border-slate-500 hover:bg-slate-50"
        htmlFor={id}>
        <span className="flex size-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm ring-1 ring-slate-200">
          <UploadIcon aria-hidden="true" className="size-6" />
        </span>
        <span className="mt-4 max-w-full truncate text-sm font-semibold">{fileName || label}</span>
        <span className="mt-1 text-xs leading-5 text-slate-500">{description}</span>
        <span className="mt-4 rounded-lg border bg-white px-3 py-2 text-xs font-medium">Choose file</span>
      </label>
      <Input accept={accept} className="sr-only" id={id} onChange={onChange} type="file" />
    </>
  );
}

function CourseForm({ course, onCancel, onSubmit }: CourseFormProps) {
  const [formData, setFormData] = useState<CourseFormData>(() =>
    course ? convertCourseToFormData(course) : { ...EMPTY_COURSE_FORM },
  );
  const [errors, setErrors] = useState<CourseFormErrors>({});

  const updateField = <Field extends keyof CourseFormData>(field: Field, value: CourseFormData[Field]) => {
    setFormData((currentData) => ({ ...currentData, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as keyof CourseFormData;

    if (field === "price" || field === "discountPercentage") {
      const normalizedValue = normalizeNonNegativeDecimalInput(
        event.target.value,
        field === "discountPercentage" ? 100 : undefined,
      );

      if (normalizedValue !== null) updateField(field, normalizedValue);
      return;
    }

    updateField(field, event.target.value);
  };

  const preventInvalidNumberKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (["e", "E", "+", "-"].includes(event.key)) event.preventDefault();
  };

  const handleFileChange = (
    field: "coverImageName" | "videoFileName" | "videoThumbnailName",
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateField(field, event.target.files?.[0]?.name ?? "");
  };

  const handleThumbnailModeChange = (mode: VideoThumbnailMode) => {
    setFormData((currentData) => ({
      ...currentData,
      videoThumbnailMode: mode,
      videoThumbnailName: mode === "automatic" ? "" : currentData.videoThumbnailName,
    }));
  };

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const validation = validateCourseForm(formData);
    setErrors(validation.errors);

    if (validation.isValid) onSubmit(formData);
  };

  const price = Math.max(0, Number(formData.price) || 0);
  const discountPercentage = Math.min(100, Math.max(0, Number(formData.discountPercentage) || 0));
  const discountAmount = (price * discountPercentage) / 100;
  const payableAmount = calculatePayableAmount(price, discountPercentage, formData.roundPayableAmount);
  const inputClassName = "h-12 rounded-lg bg-white px-3 shadow-none";

  return (
    <div className="space-y-6 h-full max-h-[calc(100dvh-75px)] flex flex-col">
      <div className="h-[calc(100vh-75px)] overflow-auto mb-0! overflow-x-hidden relative">
        <div className="flex items-start gap-3 w-full bg-white px-4 lg:px-6 xl:px-8 py-3 sticky top-0 z-40 border-b border-slate-200">
          <div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
              {course ? "Edit course" : "Add course"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {course ? "Update the course information and media." : "Create a course for the yoga platform."}
            </p>
          </div>
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.85fr)] relative p-4 sm:p-6 lg:p-8 flex-3 pb-0! mb-0">
          <div className="space-y-6">
            <Card className="gap-0 py-0">
              <CardHeader className="border-b px-5 py-5 sm:px-7">
                <CardTitle className="text-lg">Course details</CardTitle>
                <p className="text-sm leading-6 text-slate-500">Add the course information and configure its price.</p>
              </CardHeader>
              <CardContent className="space-y-6 px-5 py-6 sm:px-7">
                <div className="space-y-2">
                  <Label htmlFor="course-title">Course title</Label>
                  <Input
                    aria-invalid={Boolean(errors.title)}
                    className={inputClassName}
                    id="course-title"
                    name="title"
                    onChange={handleInputChange}
                    placeholder="e.g. Foundations of Hatha Yoga"
                    value={formData.title}
                  />
                  <FieldError message={errors.title} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea
                    aria-invalid={Boolean(errors.description)}
                    className="min-h-36 resize-y rounded-lg bg-white px-3 py-3 shadow-none"
                    id="course-description"
                    name="description"
                    onChange={handleInputChange}
                    placeholder="Describe what students will learn in this course..."
                    value={formData.description}
                  />
                  <FieldError message={errors.description} />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="course-price">Price (₹)</Label>
                    <Input
                      aria-invalid={Boolean(errors.price)}
                      className={inputClassName}
                      id="course-price"
                      min="0"
                      name="price"
                      onChange={handleInputChange}
                      onKeyDown={preventInvalidNumberKeys}
                      placeholder="1499"
                      step="0.01"
                      type="number"
                      value={formData.price}
                    />
                    <FieldError message={errors.price} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-discount">Discount (%)</Label>
                    <Input
                      aria-invalid={Boolean(errors.discountPercentage)}
                      className={inputClassName}
                      id="course-discount"
                      max="100"
                      min="0"
                      name="discountPercentage"
                      onChange={handleInputChange}
                      onKeyDown={preventInvalidNumberKeys}
                      placeholder="10"
                      step="0.01"
                      type="number"
                      value={formData.discountPercentage}
                    />
                    <FieldError message={errors.discountPercentage} />
                  </div>
                </div>

                <div className="rounded-xl border bg-slate-50 p-4 sm:p-5">
                  <div className="grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-slate-500">Course price</p>
                      <p className="mt-1 font-semibold">{formatCoursePrice(price)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Discount</p>
                      <p className="mt-1 font-semibold text-emerald-700">− {formatCoursePrice(discountAmount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total payable</p>
                      <p className="mt-1 text-lg font-semibold">{formatCoursePrice(payableAmount)}</p>
                    </div>
                  </div>
                  <label
                    className="mt-4 flex cursor-pointer items-start gap-3 border-t pt-4"
                    htmlFor="round-payable-amount">
                    <Checkbox
                      checked={formData.roundPayableAmount}
                      id="round-payable-amount"
                      onCheckedChange={(checked) => updateField("roundPayableAmount", checked)}
                    />
                    <span>
                      <span className="block text-sm font-medium">Round off the total payable amount</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500">
                        Rounds the final amount to the nearest whole rupee.
                      </span>
                    </span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-0">
              <CardHeader className="border-b px-5 py-5 sm:px-7">
                <CardTitle className="text-lg">Upload course video</CardTitle>
                <p className="text-sm leading-6 text-slate-500">Upload the main video students will watch.</p>
              </CardHeader>
              <CardContent className="px-5 py-6 sm:px-7">
                <UploadDropZone
                  accept="video/mp4,video/quicktime,video/webm"
                  description="MP4, MOV, or WebM · mock upload for now"
                  fileName={formData.videoFileName}
                  icon={UploadCloud}
                  id="course-video"
                  label="Drag and drop your course video here"
                  onChange={(event) => handleFileChange("videoFileName", event)}
                />
                {formData.videoFileName && (
                  <div className="mt-4 flex items-center gap-3 rounded-lg border bg-white p-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <FileVideo2 aria-hidden="true" className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{formData.videoFileName}</p>
                      <p className="mt-1 text-xs text-slate-500">Video selected and ready to save</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:sticky xl:top-28">
            <Card className="gap-0 py-0">
              <CardHeader className="border-b px-5 py-5">
                <CardTitle className="text-lg">Course thumbnail</CardTitle>
                <p className="text-sm leading-6 text-slate-500">Upload the cover shown across the platform.</p>
              </CardHeader>
              <CardContent className="px-5 py-6">
                <UploadDropZone
                  accept="image/png,image/jpeg,image/webp"
                  description="PNG, JPG, or WebP · recommended 16:9"
                  fileName={formData.coverImageName}
                  icon={ImageUp}
                  id="course-cover"
                  label="Upload course thumbnail"
                  onChange={(event) => handleFileChange("coverImageName", event)}
                />
              </CardContent>
            </Card>

            {formData.videoFileName && (
              <Card className="gap-0 py-0">
                <CardHeader className="border-b px-5 py-5">
                  <CardTitle className="text-lg">Video thumbnail</CardTitle>
                  <p className="text-sm leading-6 text-slate-500">Choose how the video thumbnail should be created.</p>
                </CardHeader>
                <CardContent className="space-y-5 px-5 py-6">
                  <div className="grid grid-cols-2 overflow-hidden rounded-lg border">
                    {(["automatic", "custom"] as VideoThumbnailMode[]).map((mode) => (
                      <label
                        className={`flex cursor-pointer items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition ${
                          formData.videoThumbnailMode === mode
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                        key={mode}>
                        <input
                          checked={formData.videoThumbnailMode === mode}
                          className="sr-only"
                          name="videoThumbnailMode"
                          onChange={() => handleThumbnailModeChange(mode)}
                          type="radio"
                          value={mode}
                        />
                        <span className="size-2 rounded-full bg-current" />
                        {mode === "automatic" ? "Automatic" : "Custom"}
                      </label>
                    ))}
                  </div>

                  {formData.videoThumbnailMode === "custom" && (
                    <UploadDropZone
                      accept="image/png,image/jpeg,image/webp"
                      description="PNG, JPG, or WebP · recommended 16:9"
                      fileName={formData.videoThumbnailName}
                      icon={Video}
                      id="video-thumbnail"
                      label="Upload video thumbnail"
                      onChange={(event) => handleFileChange("videoThumbnailName", event)}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t py-2.5 px-10 sm:flex-row sm:justify-end w-full bg-white flex-1">
        <Button className="py-7 px-7 text-base" onClick={onCancel} type="button" variant="outline">
          Cancel
        </Button>
        <Button className="py-7 px-7 text-base" onClick={handleSubmit}>
          {course ? "Save changes" : "Create course"}
        </Button>
      </div>
    </div>
  );
}

export default CourseForm;

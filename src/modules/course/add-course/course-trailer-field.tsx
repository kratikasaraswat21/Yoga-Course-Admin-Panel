import { CheckCircle2, Clapperboard, LoaderCircle, RefreshCw, Trash2, TriangleAlert, UploadCloud } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import * as tus from "tus-js-client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/variants/toast.manager";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseTrailer } from "./add-course.types";
import { ImageField } from "./landing-editor-fields";

const MAX_TRAILER_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB, same as the backend
const STATUS_POLL_MS = 10_000;

const readVideoDuration = (file: File) =>
  new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
    video.src = objectUrl;
  });

const uploadWithTus = (file: File, uploadUrl: string, onProgress: (percentage: number) => void) =>
  new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      uploadUrl,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 50 * 1024 * 1024,
      metadata: { filename: file.name, filetype: file.type },
      onError: reject,
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });
    upload.start();
  });

/**
 * Course trailer on Cloudflare Stream. The public page shows its thumbnail with a play button.
 * `poster` is the optional custom thumbnail; it's saved with the rest of the landing page.
 */
function CourseTrailerField({
  courseId,
  trailer,
  poster,
  onPosterChange,
  onRefresh,
}: {
  courseId: string;
  trailer: CourseTrailer | null;
  poster: { imageUrl: string; imageId: string };
  onPosterChange: (poster: { imageUrl: string; imageId: string }) => void;
  onRefresh: () => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isProcessing =
    trailer?.status === "UPLOADING" || trailer?.status === "PROCESSING" || trailer?.status === "PENDING";

  // While Cloudflare processes the trailer, check its status now and then.
  useEffect(() => {
    if (!isProcessing || uploadProgress !== null) return;
    const timer = window.setInterval(() => void onRefresh(), STATUS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [isProcessing, onRefresh, uploadProgress]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type) || file.size > MAX_TRAILER_SIZE) {
      toast.add({
        title: ERROR_MESSAGES.COURSE_VIDEO_UPLOAD_FAILED_TITLE,
        description: "Choose an MP4, MOV or WebM video up to 5 GB.",
        type: "error",
      });
      return;
    }

    setUploadProgress(0);
    try {
      const durationSeconds = await readVideoDuration(file);
      const response = await multipleApiHandler([
        {
          endPoint: `/course/${courseId}/trailer/upload-url`,
          method: "POST",
          protected: true,
          data: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            maxDurationSeconds: Math.max(1, Math.ceil(durationSeconds) || 1800),
          },
        },
      ]);
      const res = response[0];
      const uploadUrl = res?.data?.data?.uploadUrl;
      if (!res?.ok || !res.data?.success || !uploadUrl) {
        throw new Error(res?.data?.message ?? "Unable to start the trailer upload.");
      }

      await uploadWithTus(file, String(uploadUrl), setUploadProgress);
      toast.add({
        title: "Trailer uploaded",
        description: "Cloudflare is processing it. It appears on the page once it's ready.",
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: ERROR_MESSAGES.COURSE_VIDEO_UPLOAD_FAILED_TITLE,
        description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
        type: "error",
      });
    } finally {
      setUploadProgress(null);
      await onRefresh();
    }
  };

  const deleteTrailer = async () => {
    setIsDeleting(true);
    const response = await multipleApiHandler([
      { endPoint: `/course/${courseId}/trailer`, method: "DELETE", protected: true },
    ]);
    setIsDeleting(false);
    setConfirmDelete(false);

    const res = response[0];
    toast.add({
      title: res?.data?.success ? "Trailer deleted" : "Trailer could not be deleted",
      description: res?.data?.message ?? "",
      type: res?.data?.success ? "success" : "error",
    });
    if (res?.data?.success) {
      onPosterChange({ imageUrl: "", imageId: "" });
      await onRefresh();
    }
  };

  const status =
    uploadProgress !== null ? (
      <span className="inline-flex items-center gap-2 text-blue-700">
        <LoaderCircle className="size-4 animate-spin" /> Uploading {uploadProgress}%
      </span>
    ) : trailer?.status === "READY" ? (
      <span className="inline-flex items-center gap-2 text-emerald-700">
        <CheckCircle2 className="size-4" /> Ready · shown on the page
      </span>
    ) : trailer?.status === "ERROR" ? (
      <span className="inline-flex items-center gap-2 text-red-700">
        <TriangleAlert className="size-4" /> Cloudflare couldn&apos;t process this video. Upload it again.
      </span>
    ) : trailer ? (
      <span className="inline-flex items-center gap-2 text-blue-700">
        <LoaderCircle className="size-4 animate-spin" /> Processing… it appears on the page once it&apos;s ready
      </span>
    ) : null;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Course trailer (optional)</p>
        <p className="mt-1 text-xs text-slate-500">
          Shown in 16:9 under the hero, as your thumbnail with a play button. Visitors can only play, pause and restart
          it. Without a trailer, this section is hidden.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-slate-50/50 p-4">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 text-slate-500">
          {poster.imageUrl || trailer?.thumbnailUrl ? (
            <img alt="" className="size-full object-cover" src={poster.imageUrl || trailer?.thumbnailUrl || ""} />
          ) : (
            <Clapperboard className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1 text-sm">
          <p className="truncate font-medium">{trailer?.fileName ?? "No trailer uploaded"}</p>
          {status && <p className="mt-1 text-xs">{status}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {isProcessing && uploadProgress === null && (
            <Button className="h-9 gap-2" onClick={() => void onRefresh()} type="button" variant="outline">
              <RefreshCw className="size-4" /> Check status
            </Button>
          )}
          <Button
            className="h-9 gap-2"
            disabled={uploadProgress !== null || isDeleting}
            onClick={() => inputRef.current?.click()}
            type="button"
            variant="outline">
            <UploadCloud className="size-4" /> {trailer ? "Replace trailer" : "Upload trailer"}
          </Button>
          {trailer && !confirmDelete && (
            <Button
              className="h-9 gap-2"
              disabled={uploadProgress !== null}
              onClick={() => setConfirmDelete(true)}
              type="button"
              variant="outline">
              <Trash2 className="size-4" /> Delete
            </Button>
          )}
          {trailer && confirmDelete && (
            <>
              <Button className="h-9" onClick={() => setConfirmDelete(false)} type="button" variant="outline">
                Keep
              </Button>
              <Button
                className="h-9 gap-2"
                disabled={isDeleting}
                onClick={() => void deleteTrailer()}
                type="button"
                variant="destructive">
                {isDeleting && <LoaderCircle className="size-4 animate-spin" />} Delete trailer
              </Button>
            </>
          )}
        </div>
        <input
          accept="video/mp4,video/quicktime,video/webm"
          className="sr-only"
          onChange={handleFileChange}
          ref={inputRef}
          type="file"
        />
      </div>

      {trailer && (
        <ImageField
          aspectClassName="aspect-video"
          hint="Shown before the trailer plays. 16:9 works best. Without one, Cloudflare's automatic thumbnail from the video is used."
          imageUrl={poster.imageUrl}
          label="Trailer thumbnail"
          onChange={onPosterChange}
        />
      )}
    </div>
  );
}

export default CourseTrailerField;

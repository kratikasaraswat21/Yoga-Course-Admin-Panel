import axios from "axios";
import { GripVertical, ImageUp, LoaderCircle, MessageSquareHeart, Trash2 } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/variants/toast.manager";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import type { InstagramFeedbackImage } from "@/utils/interface/instagram-feedback.interface";
import type { MediaSignature } from "@/utils/interface/pdf-course.interface";
import {
  INSTAGRAM_FEEDBACK_IMAGE_TYPES,
  validateInstagramFeedbackImage,
} from "@/utils/validation/instagram-feedback.validation";

const getUploadSignature = async (): Promise<MediaSignature> => {
  const response = await multipleApiHandler([
    { endPoint: "instagram-feedback/cloud/signature", method: "POST", protected: true },
  ]);
  const result = response[0];
  if (!result?.ok || !result.data?.success || !result.data.data) {
    throw new Error(result?.data?.message ?? "Couldn't start the upload. Please try again.");
  }
  return result.data.data as unknown as MediaSignature;
};

const uploadToCloudinary = async (file: File, signature: MediaSignature) => {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", signature.apiKey);
  body.append("timestamp", String(signature.timestamp));
  body.append("signature", signature.upload_info.signature);
  if (signature.upload_info.folder) body.append("folder", signature.upload_info.folder);

  const response = await axios.post(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, body);
  const imageUrl = response.data.secure_url as string | undefined;
  const publicId = response.data.public_id as string | undefined;
  if (!imageUrl || !publicId) throw new Error("Cloudinary didn't return the uploaded image.");
  return { imageUrl, publicId };
};

/**
 * Student feedback screenshots, in this order. Upload several at once, drag to reorder, delete with a
 * confirmation. Without `courseId` it manages the global images (home page, and course pages that have
 * none of their own); with it, that course's own images.
 */
export function InstagramFeedbackManager({ courseId }: { courseId?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<InstagramFeedbackImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isCourse = Boolean(courseId);
  const courseQuery = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";

  useEffect(() => {
    let isActive = true;
    multipleApiHandler([
      { endPoint: `instagram-feedback/fetch${courseQuery}`, method: "GET", protected: true },
    ]).then((response) => {
      if (!isActive) return;
      const result = response[0];
      setImages(result?.data?.success && Array.isArray(result.data.data?.images) ? result.data.data.images : []);
      setIsLoading(false);
    });
    return () => {
      isActive = false;
    };
  }, [courseQuery]);

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const problems = files.map(validateInstagramFeedbackImage).filter((problem): problem is string => Boolean(problem));
    if (problems.length > 0) {
      toast.add({ title: "Some images can't be uploaded", description: problems.join(" "), type: "error" });
      return;
    }

    setUploadProgress({ done: 0, total: files.length });
    let added = 0;
    try {
      const signature = await getUploadSignature();
      // One at a time, so the order on the page follows the order the files were picked in.
      for (const file of files) {
        const { imageUrl, publicId } = await uploadToCloudinary(file, signature);
        const response = await multipleApiHandler([
          {
            endPoint: "instagram-feedback/add",
            method: "POST",
            protected: true,
            data: { imageUrl, publicId, altText: "Student feedback", ...(courseId && { courseId }) },
          },
        ]);
        const result = response[0];
        if (!result?.ok || !result.data?.success)
          throw new Error(result?.data?.message ?? "The image couldn't be saved.");
        const image = result.data.data?.image as InstagramFeedbackImage | undefined;
        if (image) setImages((current) => [...current, image]);
        added += 1;
        setUploadProgress({ done: added, total: files.length });
      }
      toast.add({ title: added === 1 ? "Image added" : `${added} images added`, type: "success" });
    } catch (error) {
      toast.add({
        title: added > 0 ? `${added} of ${files.length} images added` : "Upload failed",
        description: error instanceof Error ? error.message : "Please try again.",
        type: "error",
      });
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDrop = async (targetId: string) => {
    const sourceId = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!sourceId || sourceId === targetId) return;

    const sourceIndex = images.findIndex((image) => image.id === sourceId);
    const targetIndex = images.findIndex((image) => image.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const previous = images;
    const reordered = [...images];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setImages(reordered);

    const response = await multipleApiHandler([
      {
        endPoint: "instagram-feedback/reorder",
        method: "PUT",
        protected: true,
        data: { orderedIds: reordered.map((image) => image.id), ...(courseId && { courseId }) },
      },
    ]);
    const result = response[0];
    if (!result?.data?.success) {
      setImages(previous);
      toast.add({ title: "Order not saved", description: result?.data?.message ?? "Please try again.", type: "error" });
    }
  };

  const deleteImage = async (id: string) => {
    setDeletingId(id);
    const response = await multipleApiHandler([
      { endPoint: `instagram-feedback/delete?id=${encodeURIComponent(id)}`, method: "DELETE", protected: true },
    ]);
    setDeletingId(null);
    setConfirmDeleteId(null);

    const result = response[0];
    if (result?.data?.success) {
      setImages((current) => current.filter((image) => image.id !== id));
      toast.add({ title: "Image deleted", type: "success" });
    } else {
      toast.add({
        title: "Image not deleted",
        description: result?.data?.message ?? "Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {isCourse ? (
          <div>
            <p className="text-sm font-medium">Screenshots for this course</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Shown only on this course&apos;s page, in this order. Drag an image to move it. Without any, the page shows
              the global screenshots from Instagram Feedback. Changes save right away.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Instagram Feedback</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Screenshots of student messages, shown on the home page and on every course page that has none of its own,
              in this order. Drag an image to move it.
            </p>
          </div>
        )}
        <Button
          className="h-10 gap-2"
          disabled={uploadProgress !== null}
          onClick={() => inputRef.current?.click()}
          type="button">
          {uploadProgress ? (
            <>
              <LoaderCircle className="size-4 animate-spin" /> Uploading{" "}
              {Math.min(uploadProgress.done + 1, uploadProgress.total)} of {uploadProgress.total}
            </>
          ) : (
            <>
              <ImageUp className="size-4" /> Upload screenshots
            </>
          )}
        </Button>
        <input
          accept={INSTAGRAM_FEEDBACK_IMAGE_TYPES.join(",")}
          className="sr-only"
          multiple
          onChange={handleFiles}
          ref={inputRef}
          type="file"
        />
      </div>

      {isLoading ? (
        <div className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 ${isCourse ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton className="aspect-[9/16] w-full rounded-xl bg-slate-200" key={index} />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
          <MessageSquareHeart className="size-8 text-slate-400" />
          <p className="mt-3 font-medium">No screenshots yet</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {isCourse
              ? "Upload PNG, JPG or WebP screenshots (up to 5 MB each). Until you add some, this course shows the global screenshots."
              : "Upload PNG, JPG or WebP screenshots (up to 5 MB each). Until you add some, the website shows its built-in screenshots."}
          </p>
        </div>
      ) : (
        <ul className={`mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 ${isCourse ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}>
          {images.map((image, index) => (
            <li
              className={`group relative overflow-hidden rounded-xl border bg-white transition ${
                dragOverId === image.id ? "ring-2 ring-slate-900" : ""
              } ${draggedId === image.id ? "opacity-50" : ""}`}
              draggable={confirmDeleteId !== image.id}
              key={image.id}
              onDragEnd={() => {
                setDraggedId(null);
                setDragOverId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dragOverId !== image.id) setDragOverId(image.id);
              }}
              onDragStart={() => setDraggedId(image.id)}
              onDrop={(event) => {
                event.preventDefault();
                void handleDrop(image.id);
              }}>
              <img
                alt={image.altText ?? `Student feedback ${index + 1}`}
                className="aspect-[9/16] w-full bg-slate-100 object-cover object-top"
                draggable={false}
                src={image.imageUrl}
              />
              <div className="flex items-center justify-between gap-2 border-t px-3 py-2 text-sm">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <GripVertical aria-label="Drag to reorder" className="size-4 cursor-grab" /> {index + 1}
                </span>
                <Button
                  aria-label={`Delete screenshot ${index + 1}`}
                  className="size-8 text-red-600 hover:text-red-700"
                  onClick={() => setConfirmDeleteId(image.id)}
                  size="icon"
                  type="button"
                  variant="ghost">
                  <Trash2 className="size-4" />
                </Button>
              </div>
              {confirmDeleteId === image.id && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 p-4 text-center">
                  <p className="text-sm font-medium">Delete this screenshot?</p>
                  <p className="text-xs text-slate-500">It is removed from the website and from Cloudinary.</p>
                  <div className="flex gap-2">
                    <Button className="h-9" onClick={() => setConfirmDeleteId(null)} type="button" variant="outline">
                      Keep
                    </Button>
                    <Button
                      className="h-9 gap-2"
                      disabled={deletingId === image.id}
                      onClick={() => void deleteImage(image.id)}
                      type="button"
                      variant="destructive">
                      {deletingId === image.id && <LoaderCircle className="size-4 animate-spin" />} Delete
                    </Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Admin page for the global screenshots. */
function InstagramFeedbackManagementPage() {
  return (
    <section className="flex min-h-full w-full flex-col p-4 sm:p-6 lg:p-8">
      <InstagramFeedbackManager />
    </section>
  );
}

export default InstagramFeedbackManagementPage;

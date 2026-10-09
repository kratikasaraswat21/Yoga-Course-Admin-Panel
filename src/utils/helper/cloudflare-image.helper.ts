import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CloudflareImageUploadResponse } from "@/utils/interface/global.interface";

/** Uploads an image to Cloudflare Images through the same signed-URL flow as course thumbnails. */
export async function uploadCourseImageToCloudflare(file: File, onProgress?: (percentage: number) => void) {
  const response = await multipleApiHandler([
    {
      endPoint: "/course/cloud/thumbnail/upload-url",
      method: "POST",
      protected: true,
      data: { fileName: file.name, fileType: file.type, fileSize: file.size },
    },
  ]);
  const res = response[0];

  if (!res?.ok || !res.data?.success || !res.data.data?.uploadUrl) {
    throw new Error(res?.data?.message ?? ERROR_MESSAGES.COURSE_THUMBNAIL_UPLOAD_URL_FAILED);
  }

  const uploadUrl = String(res.data.data.uploadUrl);

  const result = await new Promise<CloudflareImageUploadResponse>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl, true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText) as CloudflareImageUploadResponse;
        if (xhr.status >= 200 && xhr.status < 300 && body.success) {
          resolve(body);
          return;
        }
        reject(new Error(body.errors?.[0]?.message ?? ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION));
      } catch {
        reject(new Error(ERROR_MESSAGES.COURSE_THUMBNAIL_INVALID_RESPONSE));
      }
    };

    xhr.onerror = () => reject(new Error(ERROR_MESSAGES.COURSE_THUMBNAIL_NETWORK_ERROR));

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });

  return { imageUrl: result.result?.variants?.[0] ?? "", imageId: result.result?.id ?? "" };
}

/** Deletes an image uploaded with uploadCourseImageToCloudflare. */
export async function deleteCourseImageFromCloudflare(imageId: string) {
  const response = await multipleApiHandler([
    { endPoint: `/course/cloud/thumbnail/${encodeURIComponent(imageId)}`, method: "DELETE", protected: true },
  ]);
  const res = response[0];

  if (!res?.ok || !res.data?.success) {
    throw new Error(res?.data?.message ?? "The image could not be deleted.");
  }
}

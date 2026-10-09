import type { CourseVideo } from "@/modules/course/add-course/add-course.types";

export function formatCourseVideos(videos: unknown[], courseId: string): CourseVideo[] {
  return videos.map((item, index) => {
    const video = (item ?? {}) as Record<string, unknown>;

    return {
      cloudflareVideoUid: String(video.cloudflareVideoUid ?? "") || undefined,
      createdAt: String(video.createdAt ?? "") || undefined,
      dashUrl: String(video.dashUrl ?? "") || undefined,
      description: String(video.description ?? ""),
      durationSeconds: Number(video.durationSeconds ?? 0) || undefined,
      errorCode: video.errorCode as string | null | undefined,
      errorMessage: video.errorMessage as string | null | undefined,
      fileSize: String(video.fileSize ?? "") || undefined,
      fileType: String(video.fileType ?? "") || undefined,
      height: Number(video.height ?? 0) || undefined,
      hlsUrl: String(video.hlsUrl ?? "") || undefined,
      id: String(video.id ?? `${courseId}-video-${index}`),
      isCustomThumbnail: Boolean(video.isCustomThumbnail),
      originalFileName: String(
        video.originalFileName ??
          video.originalName ??
          video.fileName ??
          video.filename ??
          video.name ??
          "Untitled video",
      ),
      processingPercentage: Number(video.processingPercentage ?? 0),
      readyToStream: Boolean(video.readyToStream),
      releaseDate: typeof video.releaseDate === "string" && video.releaseDate ? video.releaseDate : null,
      isScheduled: Boolean(video.isScheduled),
      groupId: typeof video.groupId === "string" && video.groupId ? video.groupId : null,
      sortOrder: Number(video.sortOrder ?? index),
      status: String(video.status ?? "Processing").toLowerCase() === "ready" ? "Ready" : "Processing",
      thumbnailId: String(video.thumbnailId ?? "") || undefined,
      thumbnailUrl: String(video.thumbnailUrl ?? video.thumbnailURL ?? video.thumbnail_url ?? "") || undefined,
      title: String(video.title ?? "Untitled video"),
      updatedAt: String(video.updatedAt ?? "") || undefined,
      width: Number(video.width ?? 0) || undefined,
      yogaCourseId: String(video.yogaCourseId ?? "") || undefined,
    };
  });
}

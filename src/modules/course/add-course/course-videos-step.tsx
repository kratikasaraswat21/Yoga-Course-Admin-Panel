import {
  FolderPlus,
  GripVertical,
  LoaderCircle,
  Lock,
  Pencil,
  RefreshCw,
  Rocket,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/variants/toast.manager";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { formatCourseVideos } from "@/utils/helper/course-video.helper";
import { formatScheduleDate } from "@/utils/helper/ist-date.helper";
import { validateCourseVideoFile } from "@/utils/validation/course-video.validation";

import { useDebounce } from "@/hooks/useDebounce";
import ConfigureVideoDialog from "@/modules/course/add-course/configure-video-dialog";
import type { CourseVideo, CourseVideoConfiguration, CourseVideoGroup } from "./add-course.types";
import VideoGroupHeader from "./video-group-header";

/** Groups in order with their videos, plus ungrouped videos last (group null). */
type VideoLayout = { group: CourseVideoGroup | null; videos: CourseVideo[] }[];

const buildLayout = (videos: CourseVideo[], groups: CourseVideoGroup[]): VideoLayout => {
  const groupIds = new Set(groups.map((group) => group.id));
  return [
    ...groups.map((group) => ({
      group,
      videos: videos.filter((video) => video.groupId === group.id),
    })),
    {
      group: null,
      videos: videos.filter((video) => !video.groupId || !groupIds.has(video.groupId)),
    },
  ];
};

interface CourseVideosStepProps {
  courseId: string;
  videos: CourseVideo[];
  onVideosChange: (videos: CourseVideo[]) => void;
}

function CourseVideosStep({ courseId, videos, onVideosChange }: CourseVideosStepProps) {
  const useEffectRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [pendingVideo, setPendingVideo] = useState<CourseVideoConfiguration | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(Boolean(courseId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draggedVideoId, setDraggedVideoId] = useState<string | null>(null);
  const [dragOverVideoId, setDragOverVideoId] = useState<string | null>(null);
  const [videoToDelete, setVideoToDelete] = useState<CourseVideo | null>(null);
  const [groups, setGroups] = useState<CourseVideoGroup[]>([]);
  const [dragOverGroupKey, setDragOverGroupKey] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [showMakeLiveDialog, setShowMakeLiveDialog] = useState(false);
  const [isMakingLive, setIsMakingLive] = useState(false);
  // Group to preselect in the upload dialog ("Upload video" inside a group).
  const uploadGroupIdRef = useRef("");

  const fetchVideos = useDebounce(async () => {
    if (!courseId) {
      setIsInitialLoading(false);
      return;
    }

    try {
      const response = await multipleApiHandler([
        {
          endPoint: `/uploads/videos/fetch?courseId=${encodeURIComponent(courseId)}`,
          method: "GET",
          protected: true,
        },
        {
          endPoint: `/uploads/videos/groups?courseId=${encodeURIComponent(courseId)}`,
          method: "GET",
          protected: true,
        },
      ]);
      const result = response[0];
      const apiGroups = response[1]?.data?.data?.groups;
      if (Array.isArray(apiGroups)) setGroups(apiGroups as CourseVideoGroup[]);
      const payload = result?.data?.data;
      const apiVideos = Array.isArray(payload) ? payload : (payload?.videos ?? payload?.data ?? []);

      if (!result?.ok || !result.data?.success || !Array.isArray(apiVideos)) {
        throw new Error(result?.data?.message ?? "Unable to fetch course videos.");
      }

      onVideosChange(formatCourseVideos(apiVideos, courseId));
    } catch (error) {
      toast.add({
        description: error instanceof Error ? error.message : "Unable to fetch course videos.",
        title: "Videos could not be loaded",
        type: "error",
      });
    } finally {
      setIsInitialLoading(false);
    }
  });

  useEffect(() => {
    if (useEffectRef.current) return;
    useEffectRef.current = true;
    fetchVideos();
  }, [fetchVideos]);

  const handleFetchAgain = () => {
    setIsRefreshing(true);
    fetchVideos(false);
    window.setTimeout(() => setIsRefreshing(false), 1000);
  };

  // "Make live now" is offered while the course has ready videos but every one of them is still scheduled.
  const readyVideos = videos.filter((video) => video.status === "Ready");
  const canMakeLiveNow = readyVideos.length > 0 && readyVideos.every((video) => video.isScheduled);

  const makeCourseLiveNow = async () => {
    setIsMakingLive(true);
    try {
      const response = await multipleApiHandler([
        {
          endPoint: `/uploads/videos/courses/${encodeURIComponent(courseId)}/make-live`,
          method: "POST",
          protected: true,
        },
      ]);
      const result = response[0];
      toast.add({
        description: result?.data?.message ?? (result?.data?.success ? undefined : "The course could not be made live."),
        title: result?.data?.success ? "Course is live" : "Could not make the course live",
        type: result?.data?.success ? "success" : "error",
      });
      if (result?.data?.success) {
        setShowMakeLiveDialog(false);
        fetchVideos(false);
      }
    } finally {
      setIsMakingLive(false);
    }
  };

  const reorderVideos = useDebounce(async (payload: Record<string, unknown>) => {
    const response = await multipleApiHandler([
      {
        endPoint: "/uploads/videos/reorder",
        method: "PUT",
        protected: true,
        data: payload,
      },
    ]);
    const result = response[0];
    toast.add({
      description: result?.data?.message,
      title: result?.data?.success ? SUCCESS_MESSAGES.ORDER_UPDATED : ERROR_MESSAGES.ORDER_UPDATE_FAILED,
      type: result?.data?.success ? "success" : "error",
    });
    if (result?.data?.success) fetchVideos();
  }, 100);

  const clearDragState = () => {
    setDraggedVideoId(null);
    setDragOverVideoId(null);
    setDragOverGroupKey(null);
  };

  // With groups, every change sends the full layout (group order, each video's group, video order).
  const saveLayout = (layout: VideoLayout) => {
    const orderedVideos = layout.flatMap(({ group, videos: groupVideos }) =>
      groupVideos.map((video) => ({ ...video, groupId: group?.id ?? null })),
    );
    onVideosChange(orderedVideos);
    setGroups(layout.flatMap(({ group }) => (group ? [group] : [])));
    reorderVideos({
      courseId,
      layout: layout.map(({ group, videos: groupVideos }) => ({
        groupId: group?.id ?? null,
        videoIds: groupVideos.map((video) => video.id),
      })),
    });
  };

  /** Moves the dragged video before `targetVideoId`, or to the end of the group when dropped on its header. */
  const moveDraggedVideo = (target: { videoId?: string; groupId?: string | null }) => {
    if (!draggedVideoId || draggedVideoId === target.videoId) return clearDragState();
    const draggedVideo = videos.find((video) => video.id === draggedVideoId);
    if (!draggedVideo) return clearDragState();

    const sourceIndex = videos.findIndex((video) => video.id === draggedVideoId);
    const targetIndex = target.videoId ? videos.findIndex((video) => video.id === target.videoId) : -1;

    if (groups.length === 0) {
      // No groups: the original flat reorder (the dragged video takes the target's position).
      if (targetIndex < 0) return clearDragState();
      const reorderedVideos = [...videos];
      const [movedVideo] = reorderedVideos.splice(sourceIndex, 1);
      reorderedVideos.splice(targetIndex, 0, movedVideo);
      onVideosChange(reorderedVideos);
      clearDragState();
      reorderVideos({
        courseId,
        orderedIds: reorderedVideos.map((video) => video.id),
      });
      return;
    }

    const layout = buildLayout(videos, groups).map((entry) => ({
      ...entry,
      videos: entry.videos.filter((video) => video.id !== draggedVideoId),
    }));
    if (target.videoId) {
      const entry = layout.find((item) => item.videos.some((video) => video.id === target.videoId));
      if (!entry) return clearDragState();
      // Same as the flat list: dragging down places the video after the target, dragging up before it.
      const position = entry.videos.findIndex((video) => video.id === target.videoId);
      entry.videos.splice(sourceIndex < targetIndex ? position + 1 : position, 0, draggedVideo);
    } else {
      const entry = layout.find((item) => (item.group?.id ?? null) === (target.groupId ?? null));
      if (!entry) return clearDragState();
      entry.videos.push(draggedVideo);
    }
    clearDragState();
    saveLayout(layout);
  };

  const handleVideoDrop = (targetVideoId: string) => moveDraggedVideo({ videoId: targetVideoId });

  const moveGroup = (groupId: string, direction: -1 | 1) => {
    const layout = buildLayout(videos, groups);
    const index = layout.findIndex((entry) => entry.group?.id === groupId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || !layout[swapIndex]?.group) return;
    [layout[index], layout[swapIndex]] = [layout[swapIndex], layout[index]];
    saveLayout(layout);
  };

  const groupRequest = async (
    endPoint: string,
    method: "POST" | "PUT" | "DELETE",
    data?: unknown,
    successTitle?: string,
  ) => {
    const response = await multipleApiHandler([{ endPoint, method, protected: true, data }]);
    const result = response[0];
    toast.add({
      title: result?.data?.success ? (successTitle ?? "Saved") : "Something went wrong",
      description: result?.data?.message ?? "",
      type: result?.data?.success ? "success" : "error",
    });
    if (result?.data?.success) fetchVideos(false);
    return Boolean(result?.data?.success);
  };

  const addGroup = async () => {
    setIsAddingGroup(true);
    // Suggest the next week number; the admin can rename it.
    await groupRequest(
      "/uploads/videos/groups",
      "POST",
      { courseId, title: `Week ${groups.length + 1}` },
      "Group added",
    );
    setIsAddingGroup(false);
  };

  const addVideo = async (file?: File) => {
    if (!file) return;
    const fileError = validateCourseVideoFile(file);
    if (fileError) {
      toast.add({
        description: fileError,
        title: ERROR_MESSAGES.COURSE_VIDEO_UPLOAD_FAILED_TITLE,
        type: "error",
      });
      return;
    }

    const durationSeconds = await readVideoDuration(file);
    setPendingVideo({
      durationSeconds,
      file,
      formData: {
        description: "",
        thumbnailFile: undefined,
        thumbnailType: "custom",
        thumbnailUrl: "",
        thumbnailId: "",
        title: file.name.replace(/\.[^/.]+$/, ""),
        releaseDate: "",
        groupId: uploadGroupIdRef.current,
      },
    });
    uploadGroupIdRef.current = "";
  };

  const editVideo = (video: CourseVideo) => {
    const file = new File([], video.originalFileName, {
      type: video.fileType || "video/mp4",
    });

    setPendingVideo({
      durationSeconds: video.durationSeconds ?? 0,
      file,
      formData: {
        description: video.description ?? "",
        thumbnailFile: undefined,
        thumbnailType: "custom",
        thumbnailUrl: video.thumbnailUrl ?? "",
        thumbnailId: video.thumbnailId ?? "",
        title: video.title ?? "",
        releaseDate: video.releaseDate ?? "",
        groupId: video.groupId ?? "",
      },
      videoId: video.id,
    });
  };

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

  const confirmVideo = () => {
    fetchVideos(false);
    setPendingVideo(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    addVideo(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addVideo(event.dataTransfer.files?.[0]);
  };

  const handelDeleteVideoWithDebounce = useDebounce(async (videoId: string) => {
    const response = await multipleApiHandler([
      {
        endPoint: `/uploads/videos/delete/${videoId}`,
        method: "DELETE",
        protected: true,
      },
    ]);
    const res = response[0];

    toast.add({
      description:
        res?.data?.message ??
        (res?.data?.success ? "The video was deleted successfully." : "The video could not be deleted."),
      title: res?.data?.success ? "Video deleted" : "Video deletion failed",
      type: res?.data?.success ? "success" : "error",
    });
    if (res?.data?.success) fetchVideos(false);
  });

  const handelDeleteYogaVideo = (videoId: string) => {
    handelDeleteVideoWithDebounce(videoId);
    setVideoToDelete(null);
  };

  const renderVideoRow = (video: CourseVideo) => (
    <tr
      className={`border-b transition-shadow last:border-0 ${dragOverVideoId === video.id ? "ring-2 ring-slate-900" : ""} ${draggedVideoId === video.id ? "opacity-50" : ""}`}
      draggable
      key={video.id}
      onDragEnd={clearDragState}
      onDragOver={(event) => {
        event.preventDefault();
        if (draggedVideoId !== video.id) setDragOverVideoId(video.id);
      }}
      onDragStart={() => setDraggedVideoId(video.id)}
      onDrop={() => handleVideoDrop(video.id)}>
      <td className="px-6 py-5 text-center">
        <GripVertical className="mx-auto size-5 text-slate-600" />
      </td>
      <td className="max-w-0 px-6 py-5">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-200 text-slate-500 ring-1 ring-slate-300">
            {video.thumbnailUrl ? (
              <img alt="" className="size-full object-cover" src={video.thumbnailUrl} />
            ) : (
              <Video className="size-6" />
            )}
          </span>
          <span className="truncate text-slate-950">{video.originalFileName}</span>
        </span>
      </td>
      <td className="max-w-0 px-6 py-5">
        <span className="block truncate text-slate-950">{video.title}</span>
        {video.isScheduled && video.releaseDate && (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            <Lock className="size-3" /> Releases {formatScheduleDate(video.releaseDate)}
          </span>
        )}
      </td>
      <td className="px-6 py-5">
        <span
          className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
            video.status === "Ready" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
          }`}>
          <span className={`size-2 rounded-full ${video.status === "Ready" ? "bg-emerald-500" : "bg-blue-500"}`} />
          {video.status}
        </span>
      </td>
      <td className="w-28 whitespace-nowrap px-6 py-5 text-right">
        <button
          aria-label={`Edit ${video.title}`}
          className="mr-1 inline-flex rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          onClick={(event) => {
            event.stopPropagation();
            editVideo(video);
          }}
          type="button">
          <Pencil className="size-4" />
        </button>
        <button
          aria-label={`Delete ${video.originalFileName}`}
          className="inline-flex rounded-md p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          onClick={(event) => {
            event.stopPropagation();
            setVideoToDelete(video);
          }}
          type="button">
          <Trash2 className="size-4" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-3 px-4 py-5 sm:px-6 lg:px-6 xl:space-y-4">
      {showSuccessBanner && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          <div className="flex items-center gap-3">
            <span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span>
            <span>Course details saved. You can now upload videos.</span>
          </div>
          <button
            aria-label="Dismiss success message"
            className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100"
            onClick={() => setShowSuccessBanner(false)}
            type="button">
            <X className="size-4" />
          </button>
        </div>
      )}

      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-6">
          <CardTitle className="text-base font-bold">Upload course videos</CardTitle>
          <p className="text-sm text-slate-500">Upload the main videos students will watch.</p>
        </CardHeader>
        <CardContent className="px-5 py-5 sm:px-6">
          <div
            className={`flex min-h-[194px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-50/40"}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}>
            <span className="flex size-12 items-center justify-center rounded-full border bg-white text-slate-700">
              <UploadCloud className="size-6" />
            </span>
            <p className="mt-4 text-sm font-bold">Drag and drop your course video here</p>
            <p className="mt-1 text-sm text-slate-500">MP4, MOV, or WebM · no size or duration limit</p>
            <input
              accept="video/mp4,video/quicktime,video/webm"
              className="sr-only"
              onChange={handleFileChange}
              ref={inputRef}
              type="file"
            />
            <Button
              className="mt-4 h-10 bg-white text-slate-900 shadow-none ring-1 ring-slate-200 hover:bg-slate-100"
              onClick={() => inputRef.current?.click()}
              type="button"
              variant="outline">
              Choose video
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-5">
          <div>
            <CardTitle className="text-base font-bold">Uploaded videos</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              Optional: group videos into weeks. Drag a video onto another video or onto a week heading to move it.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {canMakeLiveNow && (
              <Button className="h-9 gap-2 px-3" onClick={() => setShowMakeLiveDialog(true)} type="button">
                <Rocket className="size-4" />
                Make live now
              </Button>
            )}
            <Button
              className="h-9 gap-2 px-3"
              disabled={isAddingGroup || !courseId}
              onClick={() => void addGroup()}
              type="button"
              variant="outline">
              {isAddingGroup ? <LoaderCircle className="size-4 animate-spin" /> : <FolderPlus className="size-4" />}
              Add week / group
            </Button>
            <Button className="h-9 gap-2 px-3" onClick={handleFetchAgain} type="button" variant="outline">
              <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Fetch again
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isInitialLoading ? (
            <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-slate-500">
              <LoaderCircle className="size-5 animate-spin" />
              Loading videos...
            </div>
          ) : videos.length || groups.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="w-24 px-6 py-3 text-center">Order</th>
                    <th className="w-[58%] px-6 py-3">Video</th>
                    <th className="w-[18%] px-6 py-3">Title</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="w-28 whitespace-nowrap px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0
                    ? videos.map((video) => renderVideoRow(video))
                    : buildLayout(videos, groups).map(({ group, videos: groupVideos }, index, layout) =>
                        group === null && groupVideos.length === 0 ? null : (
                          <Fragment key={group?.id ?? "ungrouped"}>
                            <tr>
                              <td className="p-0" colSpan={5}>
                                <VideoGroupHeader
                                  group={group}
                                  isDropTarget={dragOverGroupKey === (group?.id ?? "ungrouped")}
                                  isFirst={index === 0}
                                  isLast={!layout[index + 1]?.group}
                                  key={group ? `${group.id}-${group.title}` : "ungrouped"}
                                  onDelete={() =>
                                    void groupRequest(
                                      `/uploads/videos/groups/${group?.id}`,
                                      "DELETE",
                                      undefined,
                                      "Group deleted",
                                    )
                                  }
                                  onDragOver={(event) => {
                                    event.preventDefault();
                                    if (draggedVideoId) setDragOverGroupKey(group?.id ?? "ungrouped");
                                  }}
                                  onDrop={() =>
                                    moveDraggedVideo({
                                      groupId: group?.id ?? null,
                                    })
                                  }
                                  onMove={(direction) => group && moveGroup(group.id, direction)}
                                  onRename={(title) =>
                                    groupRequest(
                                      `/uploads/videos/groups/${group?.id}`,
                                      "PUT",
                                      { title },
                                      "Group renamed",
                                    )
                                  }
                                  onSetReleaseDate={(releaseDate) =>
                                    groupRequest(
                                      `/uploads/videos/groups/${group?.id}/release-date`,
                                      "PUT",
                                      { releaseDate },
                                      "Release date applied",
                                    )
                                  }
                                  onUploadInto={() => {
                                    uploadGroupIdRef.current = group?.id ?? "";
                                    inputRef.current?.click();
                                  }}
                                  totalDurationSeconds={groupVideos.reduce(
                                    (total, video) => total + (video.durationSeconds ?? 0),
                                    0,
                                  )}
                                  videoCount={groupVideos.length}
                                />
                              </td>
                            </tr>
                            {groupVideos.length === 0 && (
                              <tr>
                                <td className="px-6 py-4 text-center text-xs text-slate-500" colSpan={5}>
                                  No videos in this group yet. Drag videos onto the heading or use “Upload video”.
                                </td>
                              </tr>
                            )}
                            {groupVideos.map((video) => renderVideoRow(video))}
                          </Fragment>
                        ),
                      )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-6 py-10 text-center text-sm text-slate-500">No videos uploaded yet.</p>
          )}
        </CardContent>
      </Card>
      <ConfigureVideoDialog
        key={pendingVideo?.videoId ?? pendingVideo?.file.name ?? "configure-video"}
        courseId={courseId}
        configuration={pendingVideo}
        onClose={() => setPendingVideo(null)}
        onConfirm={confirmVideo}
        fetchVideos={fetchVideos}
        groups={groups}
      />
      <AlertDialog onOpenChange={(open) => !open && !isMakingLive && setShowMakeLiveDialog(false)} open={showMakeLiveDialog}>
        <AlertDialogContent
          className="relative gap-6 p-7"
          style={{
            left: "50%",
            maxHeight: "100%",
            maxWidth: "560px",
            overflowY: "auto",
            position: "fixed",
            top: "50%",
            width: "100%",
          }}>
          <AlertDialogHeader>
            <div className="flex w-full items-center justify-between">
              <span className="pr-10 text-xl font-semibold">Make the course live now?</span>
              <button
                aria-label="Close make live confirmation"
                className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
                disabled={isMakingLive}
                onClick={() => setShowMakeLiveDialog(false)}
                type="button">
                <X className="size-5" />
              </button>
            </div>
            <AlertDialogDescription className="pt-7 text-base leading-6">
              The first scheduled videos are released right away instead of on their release date, and every
              prelaunch buyer gets the “your course is live” email. Videos scheduled for later dates stay locked. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="m-0! flex w-full flex-row justify-end gap-3 px-0! pt-6! pb-0!">
            <AlertDialogCancel className="h-12 w-1/2 min-w-0! max-w-1/2! flex-1 px-5" disabled={isMakingLive}>
              Cancel
            </AlertDialogCancel>
            <Button
              className="h-12 w-1/2 min-w-0! max-w-1/2! flex-1 gap-2 px-5"
              disabled={isMakingLive}
              onClick={() => void makeCourseLiveNow()}
              type="button">
              {isMakingLive && <LoaderCircle className="size-4 animate-spin" />}
              Make live now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog onOpenChange={(open) => !open && setVideoToDelete(null)} open={Boolean(videoToDelete)}>
        <AlertDialogContent
          className="relative gap-6 p-7"
          style={{
            left: "50%",
            maxHeight: "100%",
            maxWidth: "560px",
            overflowY: "auto",
            position: "fixed",
            top: "50%",
            width: "100%",
          }}>
          <AlertDialogHeader>
            <div className="flex w-full items-center justify-between">
              <span className="pr-10 text-xl font-semibold">Delete video?</span>
              <button
                aria-label="Close delete confirmation"
                className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
                onClick={() => setVideoToDelete(null)}
                type="button">
                <X className="size-5" />
              </button>
            </div>
            <AlertDialogDescription className="pt-7 text-base leading-6">
              Are you sure you want to delete this video? This will delete the video metadata from the database and the
              original video from Cloudflare. This process is not reversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="m-0! flex w-full flex-row justify-end gap-3 px-0! pt-6! pb-0!">
            <AlertDialogCancel className="h-12 w-1/2 min-w-0! max-w-1/2! flex-1 px-5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="h-12 w-1/2 min-w-0! max-w-1/2! flex-1 px-5"
              onClick={() => videoToDelete && handelDeleteYogaVideo(videoToDelete.id)}
              variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default CourseVideosStep;

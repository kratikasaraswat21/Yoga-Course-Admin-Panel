import { FileVideo2, GripVertical, MoreVertical, UploadCloud, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/variants/toast.manager";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { validateCourseVideoFile } from "@/utils/validation/course-video.validation";

import ConfigureVideoDialog from "./configure-video-dialog";
import type { CourseVideo, CourseVideoConfiguration } from "./add-course.types";

interface CourseVideosStepProps {
  videos: CourseVideo[];
  onVideosChange: (videos: CourseVideo[]) => void;
}

function CourseVideosStep({ videos, onVideosChange }: CourseVideosStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(true);
  const [pendingVideo, setPendingVideo] = useState<CourseVideoConfiguration | null>(null);

  const addVideo = async (file?: File) => {
    if (!file) return;
    const fileError = validateCourseVideoFile(file);
    if (fileError) {
      toast.add({ description: fileError, title: ERROR_MESSAGES.COURSE_VIDEO_UPLOAD_FAILED_TITLE, type: "error" });
      return;
    }

    const durationSeconds = await readVideoDuration(file);
    setPendingVideo({ durationSeconds, file, formData: { description: "", thumbnailFile: undefined, thumbnailType: "automatic", thumbnailUrl: "", thumbnailUrlId: "", title: file.name.replace(/\.[^/.]+$/, "") } });
  };

  const readVideoDuration = (file: File) => new Promise<number>((resolve) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);
    video.preload = "metadata";
    video.onloadedmetadata = () => { URL.revokeObjectURL(objectUrl); resolve(Number.isFinite(video.duration) ? video.duration : 0); };
    video.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(0); };
    video.src = objectUrl;
  });

  const confirmVideo = (configuration: CourseVideoConfiguration) => {
    onVideosChange([...videos, { durationSeconds: configuration.durationSeconds, fileName: configuration.file.name, id: crypto.randomUUID(), status: "Processing", title: configuration.formData.title }]);
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

  return (
    <div className="mx-auto w-full max-w-[1580px] space-y-3 px-4 py-5 sm:px-6 lg:px-6 xl:space-y-4">
      {showSuccessBanner && <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-800"><div className="flex items-center gap-3"><span className="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-white">✓</span><span>Course details saved. You can now upload videos.</span></div><button aria-label="Dismiss success message" className="rounded-md p-1 text-emerald-700 transition hover:bg-emerald-100" onClick={() => setShowSuccessBanner(false)} type="button"><X className="size-4" /></button></div>}

      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-6"><CardTitle className="text-base font-bold">Upload course videos</CardTitle><p className="text-sm text-slate-500">Upload the main videos students will watch.</p></CardHeader>
        <CardContent className="px-5 py-5 sm:px-6">
          <div className={`flex min-h-[194px] flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${isDragging ? "border-blue-500 bg-blue-50" : "border-slate-400 bg-slate-50/40"}`} onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <span className="flex size-12 items-center justify-center rounded-full border bg-white text-slate-700"><UploadCloud className="size-6" /></span>
            <p className="mt-4 text-sm font-bold">Drag and drop your course video here</p>
            <p className="mt-1 text-sm text-slate-500">MP4, MOV, or WebM · max upload 5 GB · max duration 2 hours</p>
            <input accept="video/mp4,video/quicktime,video/webm" className="sr-only" onChange={handleFileChange} ref={inputRef} type="file" />
            <Button className="mt-4 h-10 bg-white text-slate-900 shadow-none ring-1 ring-slate-200 hover:bg-slate-100" onClick={() => inputRef.current?.click()} type="button" variant="outline">Choose video</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-6"><CardTitle className="text-base font-bold">Uploaded videos</CardTitle></CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6">
          {videos.length ? <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead><tr className="border-b bg-slate-50 text-left text-xs font-medium text-slate-600"><th className="w-20 px-5 py-3">Order</th><th className="px-5 py-3">Video</th><th className="px-5 py-3">Title</th><th className="px-5 py-3">Status</th><th className="w-20 px-5 py-3 text-right">Actions</th></tr></thead><tbody>{videos.map((video) => <tr className="border-b last:border-0" key={video.id}><td className="px-5 py-4"><GripVertical className="size-5 text-slate-600" /></td><td className="px-5 py-4"><span className="flex items-center gap-3"><FileVideo2 className="size-5 text-slate-700" />{video.fileName}</span></td><td className="px-5 py-4">{video.title}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"><span className="size-2 rounded-full bg-blue-500" />{video.status}</span></td><td className="px-5 py-4 text-right"><button aria-label={`Remove ${video.fileName}`} className="rounded-md p-1.5 hover:bg-slate-100" onClick={() => onVideosChange(videos.filter((item) => item.id !== video.id))} type="button"><MoreVertical className="size-5" /></button></td></tr>)}</tbody></table></div> : <p className="py-8 text-center text-sm text-slate-500">No videos uploaded yet.</p>}
        </CardContent>
      </Card>
      <ConfigureVideoDialog key={pendingVideo?.file.name ?? "configure-video"} configuration={pendingVideo} onClose={() => setPendingVideo(null)} onConfirm={confirmVideo} />
    </div>
  );
}

export default CourseVideosStep;

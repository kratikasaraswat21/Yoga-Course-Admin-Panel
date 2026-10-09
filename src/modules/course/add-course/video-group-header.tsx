import { ArrowDown, ArrowUp, CalendarClock, Check, LoaderCircle, Pencil, Trash2, UploadCloud, X } from "lucide-react";
import { useState, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDaysToDate, getIstToday } from "@/utils/helper/ist-date.helper";
import { MAX_VIDEO_RELEASE_DAYS_AHEAD } from "@/utils/validation/course-video.validation";

const formatDuration = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} m` : `${minutes} m`;
};

/**
 * Heading row of one week/group in the videos list. `group` is null for the "Other videos" section
 * (videos without a group), which has no actions. Videos can be dropped onto the header to move
 * them into the group.
 */
function VideoGroupHeader({
  group,
  videoCount,
  totalDurationSeconds,
  isFirst,
  isLast,
  isDropTarget,
  onMove,
  onRename,
  onDelete,
  onSetReleaseDate,
  onUploadInto,
  onDragOver,
  onDrop,
}: {
  group: { id: string; title: string } | null;
  videoCount: number;
  totalDurationSeconds: number;
  isFirst: boolean;
  isLast: boolean;
  isDropTarget: boolean;
  onMove: (direction: -1 | 1) => void;
  onRename: (title: string) => Promise<boolean>;
  onDelete: () => void;
  onSetReleaseDate: (releaseDate: string) => Promise<boolean>;
  onUploadInto: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: () => void;
}) {
  const [mode, setMode] = useState<"view" | "rename" | "release" | "delete">("view");
  const [title, setTitle] = useState(group?.title ?? "");
  const [releaseDate, setReleaseDate] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const today = getIstToday();

  const run = async (action: () => Promise<boolean>) => {
    setIsBusy(true);
    const ok = await action();
    setIsBusy(false);
    if (ok) setMode("view");
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-y bg-slate-100/80 px-6 py-3 ${isDropTarget ? "ring-2 ring-inset ring-slate-900" : ""}`}
      onDragOver={onDragOver}
      onDrop={(event) => {
        event.preventDefault();
        onDrop();
      }}>
      {mode === "rename" && group ? (
        <form
          className="flex flex-1 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) void run(() => onRename(title.trim()));
          }}>
          <Input
            aria-label="Group title"
            autoFocus
            className="h-9 max-w-sm bg-white"
            maxLength={120}
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
          <Button
            aria-label="Save title"
            className="size-9"
            disabled={isBusy || !title.trim()}
            size="icon"
            type="submit">
            {isBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
          </Button>
          <Button
            aria-label="Cancel"
            className="size-9"
            onClick={() => setMode("view")}
            size="icon"
            type="button"
            variant="outline">
            <X className="size-4" />
          </Button>
        </form>
      ) : (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">{group?.title ?? "Other videos"}</p>
          <p className="text-xs text-slate-500">
            {videoCount} {videoCount === 1 ? "video" : "videos"}
            {totalDurationSeconds > 0 ? ` · ${formatDuration(totalDurationSeconds)}` : ""}
            {!group ? " · not in any group" : ""}
          </p>
        </div>
      )}

      {group && mode === "view" && (
        <div className="flex flex-wrap items-center gap-1">
          <Button
            aria-label="Move group up"
            className="size-8"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            size="icon"
            type="button"
            variant="ghost">
            <ArrowUp className="size-4" />
          </Button>
          <Button
            aria-label="Move group down"
            className="size-8"
            disabled={isLast}
            onClick={() => onMove(1)}
            size="icon"
            type="button"
            variant="ghost">
            <ArrowDown className="size-4" />
          </Button>
          <Button className="h-8 gap-1.5 px-2.5 text-xs" onClick={onUploadInto} type="button" variant="ghost">
            <UploadCloud className="size-4" /> Upload video
          </Button>
          <Button
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => {
              setTitle(group.title);
              setMode("rename");
            }}
            type="button"
            variant="ghost">
            <Pencil className="size-4" /> Rename
          </Button>
          <Button
            className="h-8 gap-1.5 px-2.5 text-xs"
            disabled={videoCount === 0}
            onClick={() => setMode("release")}
            type="button"
            variant="ghost">
            <CalendarClock className="size-4" /> Release date
          </Button>
          <Button
            className="h-8 gap-1.5 px-2.5 text-xs text-red-600 hover:text-red-700"
            onClick={() => setMode("delete")}
            type="button"
            variant="ghost">
            <Trash2 className="size-4" /> Delete
          </Button>
        </div>
      )}

      {group && mode === "release" && (
        <form
          className="flex w-full flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => onSetReleaseDate(releaseDate));
          }}>
          <span className="text-xs text-slate-600">Release every video in this group on</span>
          <Input
            aria-label="Release date for the group"
            className="h-9 w-44 bg-white"
            max={addDaysToDate(today, MAX_VIDEO_RELEASE_DAYS_AHEAD)}
            min={today}
            onChange={(event) => setReleaseDate(event.target.value)}
            type="date"
            value={releaseDate}
          />
          <Button className="h-9" disabled={isBusy} type="submit">
            {isBusy && <LoaderCircle className="size-4 animate-spin" />}
            {releaseDate ? "Apply date" : "Clear dates (visible now)"}
          </Button>
          <Button className="h-9" onClick={() => setMode("view")} type="button" variant="outline">
            Cancel
          </Button>
        </form>
      )}

      {group && mode === "delete" && (
        <div className="flex w-full flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-700">
            Delete “{group.title}”? Its videos are kept and moved to “Other videos”.
          </span>
          <Button className="h-9" onClick={() => setMode("view")} type="button" variant="outline">
            Keep
          </Button>
          <Button
            className="h-9"
            onClick={() => {
              setMode("view");
              onDelete();
            }}
            type="button"
            variant="destructive">
            Delete group
          </Button>
        </div>
      )}
    </div>
  );
}

export default VideoGroupHeader;

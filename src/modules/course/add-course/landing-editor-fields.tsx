import { ArrowDown, ArrowUp, ChevronDown, ImageUp, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/variants/toast.manager";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { uploadCourseImageToCloudflare } from "@/utils/helper/cloudflare-image.helper";
import type { PhaseText } from "./add-course.types";

/** One collapsible section of the landing page editor. */
export function EditorSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border bg-white">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
        onClick={() => setIsOpen((open) => !open)}
        type="button">
        <span>
          <span className="block text-base font-bold text-slate-950">{title}</span>
          {description && <span className="mt-0.5 block text-sm text-slate-500">{description}</span>}
        </span>
        <ChevronDown className={`size-5 shrink-0 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="space-y-5 border-t px-5 py-5 sm:px-6">{children}</div>}
    </section>
  );
}

export function TextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  hint,
  multiline = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          className="bg-white"
          id={id}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      ) : (
        <Input
          className="h-10 bg-white"
          id={id}
          maxLength={maxLength}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
      )}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** A text with a prelaunch version and a live version, side by side. */
export function PhaseTextField({
  id,
  label,
  value,
  onChange,
  maxLength,
  hint,
}: {
  id: string;
  label: string;
  value: PhaseText;
  onChange: (value: PhaseText) => void;
  maxLength: number;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {(["prelaunch", "live"] as const).map((phase) => (
          <div className="space-y-1.5" key={phase}>
            <Label className="text-xs font-normal text-slate-500" htmlFor={`${id}-${phase}`}>
              {phase === "prelaunch" ? "While the prelaunch offer is running" : "After launch (no prelaunch offer)"}
            </Label>
            <Input
              className="h-10 bg-white"
              id={`${id}-${phase}`}
              maxLength={maxLength}
              onChange={(event) => onChange({ ...value, [phase]: event.target.value })}
              value={value[phase]}
            />
          </div>
        ))}
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

const moveItem = <Item,>(items: Item[], from: number, to: number) => {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};

function RowControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button
        aria-label={`Move ${label} up`}
        className="size-9"
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
        size="icon"
        type="button"
        variant="outline">
        <ArrowUp className="size-4" />
      </Button>
      <Button
        aria-label={`Move ${label} down`}
        className="size-9"
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
        size="icon"
        type="button"
        variant="outline">
        <ArrowDown className="size-4" />
      </Button>
      <Button
        aria-label={`Remove ${label}`}
        className="size-9"
        onClick={onRemove}
        size="icon"
        type="button"
        variant="outline">
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

/** A list of single-line texts (e.g. benefits) with add, remove and reorder. */
export function TextListField({
  id,
  label,
  hint,
  items,
  onChange,
  maxItems,
  maxLength,
  placeholder,
}: {
  id: string;
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  maxItems: number;
  maxLength: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {items.map((item, index) => (
        <div className="flex items-center gap-2" key={index}>
          <Input
            aria-label={`${label} ${index + 1}`}
            className="h-10 bg-white"
            id={`${id}-${index}`}
            maxLength={maxLength}
            onChange={(event) => onChange(items.map((value, i) => (i === index ? event.target.value : value)))}
            placeholder={placeholder}
            value={item}
          />
          <RowControls
            count={items.length}
            index={index}
            label={`item ${index + 1}`}
            onMove={(to) => onChange(moveItem(items, index, to))}
            onRemove={() => onChange(items.filter((_, i) => i !== index))}
          />
        </div>
      ))}
      {items.length < maxItems && (
        <Button className="h-9 gap-2" onClick={() => onChange([...items, ""])} type="button" variant="outline">
          <Plus className="size-4" /> Add item
        </Button>
      )}
    </div>
  );
}

export interface ObjectFieldDefinition<Item> {
  key: keyof Item & string;
  label: string;
  maxLength: number;
  multiline?: boolean;
  /** Narrow fields (e.g. an emoji icon) share a row with the next field. */
  narrow?: boolean;
  placeholder?: string;
}

/** Where an uploaded icon is stored on each record; it sits next to the narrow (emoji) field. */
export interface ObjectIconUpload<Item> {
  urlKey: keyof Item & string;
  idKey: keyof Item & string;
}

/** A list of small records (e.g. FAQ items, stat tiles) with add, remove and reorder. */
export function ObjectListField<Item extends Record<string, string>>({
  label,
  hint,
  items,
  onChange,
  maxItems = Infinity,
  fields,
  emptyItem,
  itemLabel,
  iconUpload,
}: {
  label: string;
  hint?: string;
  items: Item[];
  onChange: (items: Item[]) => void;
  /** Leave out for no limit. */
  maxItems?: number;
  fields: ObjectFieldDefinition<Item>[];
  emptyItem: Item;
  itemLabel: string;
  iconUpload?: ObjectIconUpload<Item>;
}) {
  const update = (index: number, patch: Partial<Item>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {items.map((item, index) => (
        <div className="space-y-3 rounded-xl border bg-slate-50/50 p-4" key={index}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {itemLabel} {index + 1}
            </span>
            <RowControls
              count={items.length}
              index={index}
              label={`${itemLabel.toLowerCase()} ${index + 1}`}
              onMove={(to) => onChange(moveItem(items, index, to))}
              onRemove={() => onChange(items.filter((_, i) => i !== index))}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(0,1fr))]">
            {fields
              .filter((field) => field.narrow)
              .map((field) => (
                <Input
                  aria-label={`${itemLabel} ${index + 1} ${field.label}`}
                  className="h-10 bg-white sm:max-w-28"
                  key={field.key}
                  maxLength={field.maxLength}
                  onChange={(event) => update(index, { [field.key]: event.target.value } as Partial<Item>)}
                  placeholder={field.placeholder ?? field.label}
                  value={item[field.key]}
                />
              ))}
            {iconUpload && (
              <IconUploadField
                iconUrl={item[iconUpload.urlKey] ?? ""}
                label={`${itemLabel} ${index + 1} icon`}
                onChange={({ imageUrl, imageId }) =>
                  update(index, { [iconUpload.urlKey]: imageUrl, [iconUpload.idKey]: imageId } as Partial<Item>)
                }
              />
            )}
          </div>
          {fields
            .filter((field) => !field.narrow)
            .map((field) =>
              field.multiline ? (
                <Textarea
                  aria-label={`${itemLabel} ${index + 1} ${field.label}`}
                  className="bg-white"
                  key={field.key}
                  maxLength={field.maxLength}
                  onChange={(event) => update(index, { [field.key]: event.target.value } as Partial<Item>)}
                  placeholder={field.placeholder ?? field.label}
                  value={item[field.key]}
                />
              ) : (
                <Input
                  aria-label={`${itemLabel} ${index + 1} ${field.label}`}
                  className="h-10 bg-white"
                  key={field.key}
                  maxLength={field.maxLength}
                  onChange={(event) => update(index, { [field.key]: event.target.value } as Partial<Item>)}
                  placeholder={field.placeholder ?? field.label}
                  value={item[field.key]}
                />
              ),
            )}
        </div>
      ))}
      {items.length < maxItems && (
        <Button
          className="h-9 gap-2"
          onClick={() => onChange([...items, { ...emptyItem }])}
          type="button"
          variant="outline">
          <Plus className="size-4" /> Add {itemLabel.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

const ICON_TYPES = ["image/svg+xml", "image/png", "image/webp"];
const MAX_ICON_SIZE = 1024 * 1024;

/**
 * Small icon upload (SVG, PNG or WebP) shown beside an emoji field. When set, the icon replaces the
 * emoji on the page. Like ImageField, a removed icon is deleted by the backend when the step is saved.
 */
export function IconUploadField({
  label,
  iconUrl,
  onChange,
}: {
  label: string;
  iconUrl: string;
  onChange: (icon: { imageUrl: string; imageId: string }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ICON_TYPES.includes(file.type) || file.size > MAX_ICON_SIZE) {
      toast.add({
        title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
        description: "Choose an SVG, PNG or WebP icon up to 1 MB.",
        type: "error",
      });
      return;
    }

    setProgress(0);
    try {
      onChange(await uploadCourseImageToCloudflare(file, setProgress));
    } catch (error) {
      toast.add({
        title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
        description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
        type: "error",
      });
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {iconUrl ? (
        <>
          <span className="flex size-10 items-center justify-center rounded-md border bg-white p-1.5">
            <img alt="" className="size-full object-contain" src={iconUrl} />
          </span>
          <Button
            aria-label={`Remove ${label.toLowerCase()}`}
            className="h-10 gap-2"
            onClick={() => onChange({ imageUrl: "", imageId: "" })}
            type="button"
            variant="outline">
            <X className="size-4" /> Remove icon
          </Button>
        </>
      ) : (
        <Button
          aria-label={`Upload ${label.toLowerCase()}`}
          className="h-10 gap-2"
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline">
          {progress !== null ? <LoaderCircle className="size-4 animate-spin" /> : <ImageUp className="size-4" />}
          {progress !== null ? `Uploading ${progress}%` : "Upload SVG icon"}
        </Button>
      )}
      <input accept={ICON_TYPES.join(",")} className="sr-only" onChange={handleChange} ref={inputRef} type="file" />
    </div>
  );
}

// An image whose width/height is within 2% of the required ratio counts as that ratio.
const ASPECT_RATIO_TOLERANCE = 0.02;

const readImageSize = (file: File) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The image could not be read. Try another file."));
    };
    image.src = objectUrl;
  });

/**
 * Optional image (Cloudflare Images). A replaced or removed image stays in use on the live page
 * until the step is saved; the backend then deletes the old one.
 * With `requiredAspect`, the ratio is shown as a badge and other ratios are rejected before upload.
 */
export function ImageField({
  label,
  hint,
  imageUrl,
  onChange,
  aspectClassName = "aspect-video",
  requiredAspect,
  requiredSize,
}: {
  label: string;
  hint?: string;
  imageUrl: string;
  onChange: (image: { imageUrl: string; imageId: string }) => void;
  aspectClassName?: string;
  /** e.g. { width: 4, height: 5, example: "1200 × 1500 px" } */
  requiredAspect?: { width: number; height: number; example?: string };
  /** Exact pixel size, e.g. { width: 1200, height: 630 }; any other size is rejected before upload. */
  requiredSize?: { width: number; height: number };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const aspectLabel = requiredAspect ? `${requiredAspect.width}:${requiredAspect.height}` : "";
  const sizeLabel = requiredSize ? `${requiredSize.width} × ${requiredSize.height} px` : "";
  const badgeLabel = sizeLabel || aspectLabel;

  const handleChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      toast.add({
        title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
        description: "Choose a PNG, JPG or WebP image up to 10 MB.",
        type: "error",
      });
      return;
    }

    if (requiredAspect || requiredSize) {
      try {
        const { width, height } = await readImageSize(file);
        if (requiredSize && (width !== requiredSize.width || height !== requiredSize.height)) {
          toast.add({
            title: `The image must be exactly ${sizeLabel}`,
            description: `This one is ${width} × ${height} px. Resize or crop it to ${sizeLabel} and upload it again.`,
            type: "error",
          });
          return;
        }
        const expectedRatio = requiredAspect ? requiredAspect.width / requiredAspect.height : 0;
        if (requiredAspect && Math.abs(width / height - expectedRatio) / expectedRatio > ASPECT_RATIO_TOLERANCE) {
          toast.add({
            title: `This image isn't ${aspectLabel}`,
            description: `It is ${width} × ${height} px. Crop it to ${aspectLabel}${requiredAspect.example ? ` (for example ${requiredAspect.example})` : ""} and upload it again.`,
            type: "error",
          });
          return;
        }
      } catch (error) {
        toast.add({
          title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
          description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
          type: "error",
        });
        return;
      }
    }

    setProgress(0);
    try {
      onChange(await uploadCourseImageToCloudflare(file, setProgress));
    } catch (error) {
      toast.add({
        title: ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_TITLE,
        description: error instanceof Error ? error.message : ERROR_MESSAGES.MEDIA_UPLOAD_FAILED_DESCRIPTION,
        type: "error",
      });
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-2 text-sm font-medium">
        {label}
        {badgeLabel && (
          <span className="rounded-md border bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-700">
            {badgeLabel}
          </span>
        )}
      </p>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {imageUrl ? (
        <div className={`relative w-full max-w-sm overflow-hidden rounded-xl border bg-slate-50 ${aspectClassName}`}>
          <img alt="" className="size-full object-cover" src={imageUrl} />
          <button
            aria-label={`Remove ${label.toLowerCase()}`}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-slate-950/90 text-white transition hover:bg-slate-950"
            onClick={() => onChange({ imageUrl: "", imageId: "" })}
            type="button">
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          className={`flex w-full max-w-sm flex-col items-center justify-center rounded-xl border border-dashed border-slate-400 bg-slate-50/40 p-4 text-center transition hover:bg-slate-50 disabled:opacity-60 ${aspectClassName}`}
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
          type="button">
          {progress !== null ? <LoaderCircle className="size-6 animate-spin" /> : <ImageUp className="size-6" />}
          <span className="mt-2 text-sm font-semibold">
            {progress !== null ? `Uploading ${progress}%` : "Upload image"}
          </span>
          <span className="mt-1 text-xs text-slate-500">
            {requiredSize && `Exactly ${sizeLabel} · `}
            {!requiredSize && requiredAspect && `${aspectLabel} only${requiredAspect.example ? ` (e.g. ${requiredAspect.example})` : ""} · `}
            PNG, JPG or WebP · up to 10 MB
          </span>
        </button>
      )}
      <input
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
    </div>
  );
}

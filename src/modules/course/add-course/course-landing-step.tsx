import { ExternalLink, Globe, Info, LoaderCircle, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/variants/toast.manager";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { InstagramFeedbackManager } from "@/modules/instagram-feedback/instagramFeedbackManagement";
import { EnvConfig } from "@/utils/config/envConfig";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseLandingContent, CourseLandingPage, CourseTrailer } from "./add-course.types";
import {
  EMPTY_LANDING_CONTENT,
  ROADMAP_BUTTON_TEMPLATE,
  ROADMAP_EYEBROW_TEMPLATE,
  ROADMAP_NOTE_TEMPLATE,
  ROADMAP_WEEKS_TEMPLATE,
  isLandingContentEmpty,
  LANDING_CONTENT_TEMPLATE,
  LANDING_PLACEHOLDERS,
} from "./course-landing-template";
import CourseTrailerField from "./course-trailer-field";
import {
  EditorSection,
  ImageField,
  ObjectListField,
  PhaseTextField,
  TextField,
  TextListField,
} from "./landing-editor-fields";

// Same limits the backend enforces (src/utils/course-landing.util.js).
const SHORT = 160;
const TITLE = 200;
const TEXT = 600;
const LONG = 1500;
// Same rule as the backend: web pages, a path or #section on this site, email and phone links.
const SAFE_LINK = /^(https?:\/\/|\/(?!\/)|#|mailto:|tel:)/i;
const BUTTON_LINK_HINT = "Leave the link empty to hide the button. e.g. https://calendly.com/…, /courses or #buy";

const HIGHLIGHT_HINT = "Wrap words in *asterisks* to highlight them.";
const ICON_HINT = "Use an emoji or upload an icon (SVG, PNG or WebP). An uploaded icon is shown instead of the emoji.";

export interface CourseLandingStepHandle {
  /** Saves the landing page when something changed. Resolves to false when saving failed or is invalid. */
  save: () => Promise<boolean>;
}

/**
 * Fills every missing or wrongly typed field with its empty default, at every level. Content saved
 * before a field existed (e.g. instructor figures) then still has the full shape.
 */
const fillDefaults = (defaults: unknown, value: unknown): unknown => {
  if (Array.isArray(defaults)) return Array.isArray(value) ? value : defaults;
  if (defaults && typeof defaults === "object") {
    const source =
      value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(defaults as Record<string, unknown>).map(([key, fallback]) => [
        key,
        fillDefaults(fallback, source[key]),
      ]),
    );
  }
  return typeof value === typeof defaults ? value : defaults;
};

const mergeWithEmpty = (content?: unknown): CourseLandingContent =>
  fillDefaults(structuredClone(EMPTY_LANDING_CONTENT), content) as CourseLandingContent;

/** Same rules the backend checks, so the admin sees the problem before saving. */
const validateContent = (content: CourseLandingContent) => {
  if (
    content.faq.items.some(
      (item) => (item.question.trim() || item.answer.trim()) && !(item.question.trim() && item.answer.trim()),
    )
  ) {
    return "Every FAQ needs both a question and an answer.";
  }
  if (content.instructor.stats.some((stat) => stat.label.trim() && !stat.value.trim())) {
    return 'Every instructor figure needs a value, e.g. "8 yrs".';
  }
  if (content.instructor.quote.author.trim() && !content.instructor.quote.text.trim()) {
    return "The instructor quote needs the quote text.";
  }
  for (const [name, button] of [
    ["Instructor main button", content.instructor.primaryButton],
    ["Instructor second button", content.instructor.secondaryButton],
  ] as const) {
    const label = button.label.trim();
    const url = button.url.trim();
    if (label && !url) return `${name} needs a link.`;
    if (url && !label) return `${name} needs a label.`;
    if (url && !SAFE_LINK.test(url)) return `${name} link must start with https://, /, #, mailto: or tel:.`;
  }
  if (content.testimonials.quotes.some((quote) => quote.name.trim() && !quote.text.trim())) {
    return "Every student quote needs the quote text.";
  }
  const needsTitle = [
    ["stat tile", content.stats],
    ["pain point", content.painPoints.items],
    ["'How it works' step", content.howItWorks.steps],
    ["roadmap week", content.benefits.weeks],
  ] as const;
  for (const [label, items] of needsTitle) {
    if (items.some((item) => Object.values(item).some((value) => value.trim()) && !item.title.trim())) {
      return `Every ${label} needs a title.`;
    }
  }
  return null;
};

/** Keys whose value is a section object (not a list or a plain text like `statsTitle`). */
type SectionKey = {
  [Key in keyof CourseLandingContent]: CourseLandingContent[Key] extends string | unknown[] ? never : Key;
}[keyof CourseLandingContent];

function CourseLandingStep({ ref, courseId }: { ref?: Ref<CourseLandingStepHandle>; courseId: string }) {
  const hasFetchedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [landingPage, setLandingPage] = useState<CourseLandingPage | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [content, setContent] = useState<CourseLandingContent>(EMPTY_LANDING_CONTENT);
  const [trailer, setTrailer] = useState<CourseTrailer | null>(null);
  const [poster, setPoster] = useState({ imageUrl: "", imageId: "" });
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [usedTemplate, setUsedTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const snapshot = JSON.stringify({ isEnabled, content, poster });
  const isDirty = savedSnapshot !== "" && snapshot !== savedSnapshot;
  const isPublished = landingPage?.status === "PUBLISHED";
  const previewUrl = landingPage?.slug ? `${EnvConfig.LANDING_SITE_URL}/courses/${landingPage.slug}` : "";

  const update = <Key extends keyof CourseLandingContent>(key: Key, value: CourseLandingContent[Key]) => {
    setContent((current) => ({ ...current, [key]: value }));
    setError(null);
  };
  // Reads the latest weeks, since an image finishes uploading after other edits may have happened.
  const updateWeekImage = (index: number, image: { imageUrl: string; imageId: string }) => {
    setContent((current) => ({
      ...current,
      benefits: {
        ...current.benefits,
        weeks: current.benefits.weeks.map((week, i) => (i === index ? { ...week, ...image } : week)),
      },
    }));
    setError(null);
  };
  const updateIn = <Key extends SectionKey>(key: Key, patch: Partial<CourseLandingContent[Key]>) => {
    setContent((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
    setError(null);
  };

  const fetchLandingPage = useCallback(async () => {
    const response = await multipleApiHandler([
      { endPoint: `/course/${courseId}/landing-content`, method: "GET", protected: true },
    ]);
    const res = response[0];
    const page = res?.data?.data?.landingPage as CourseLandingPage | undefined;
    if (!res?.ok || !res.data?.success || !page) throw new Error(res?.data?.message ?? "Please try again.");
    return page;
  }, [courseId]);

  // Trailer status only: keeps the admin's unsaved edits.
  const refreshTrailer = useCallback(async () => {
    try {
      const page = await fetchLandingPage();
      setTrailer(page.trailer);
    } catch {
      // A failed status check is retried by the next poll.
    }
  }, [fetchLandingPage]);

  useEffect(() => {
    // Without a course ID, isLoading already starts as false.
    if (hasFetchedRef.current || !courseId) return;
    hasFetchedRef.current = true;

    fetchLandingPage()
      .then((page) => {
        const savedContent = mergeWithEmpty(page.content);
        const savedPoster = { imageUrl: page.trailer?.posterUrl ?? "", imageId: page.trailer?.posterId ?? "" };
        setLandingPage(page);
        setIsEnabled(page.landingPageEnabled);
        setTrailer(page.trailer);
        setPoster(savedPoster);
        setSavedSnapshot(
          JSON.stringify({ isEnabled: page.landingPageEnabled, content: savedContent, poster: savedPoster }),
        );
        // Nothing written yet: start from the template so the admin only has to edit it.
        if (isLandingContentEmpty(savedContent)) {
          setContent(structuredClone(LANDING_CONTENT_TEMPLATE));
          setUsedTemplate(true);
        } else if (savedContent.benefits.weeks.length === 0) {
          // Saved before the roadmap existed: offer the template weeks and button (saved with this step).
          setContent({
            ...savedContent,
            benefits: {
              ...savedContent.benefits,
              eyebrow: savedContent.benefits.eyebrow || ROADMAP_EYEBROW_TEMPLATE,
              weeks: structuredClone(ROADMAP_WEEKS_TEMPLATE),
              button: savedContent.benefits.button || ROADMAP_BUTTON_TEMPLATE,
              note: savedContent.benefits.note || ROADMAP_NOTE_TEMPLATE,
            },
          });
        } else {
          setContent(savedContent);
        }
      })
      .catch((fetchError: unknown) =>
        toast.add({
          title: ERROR_MESSAGES.LANDING_PAGE_LOAD_FAILED_TITLE,
          description: fetchError instanceof Error ? fetchError.message : "Please try again.",
          type: "error",
        }),
      )
      .finally(() => setIsLoading(false));
  }, [courseId, fetchLandingPage]);

  const save = async () => {
    if (!courseId || isLoading) return false;
    if (!isDirty) return true;

    try {
      return await saveLandingPage();
    } catch (saveError) {
      // Never leave the "Save & continue" button spinning: report the problem instead.
      const message = saveError instanceof Error ? saveError.message : "Please try again.";
      setError(message);
      toast.add({ title: ERROR_MESSAGES.LANDING_PAGE_SAVE_FAILED_TITLE, description: message, type: "error" });
      return false;
    }
  };

  const saveLandingPage = async () => {
    const validationError = isEnabled ? validateContent(content) : null;
    if (validationError) {
      setError(validationError);
      toast.add({ title: ERROR_MESSAGES.LANDING_PAGE_SAVE_FAILED_TITLE, description: validationError, type: "error" });
      return false;
    }

    const response = await multipleApiHandler([
      {
        endPoint: `/course/${courseId}/landing-content`,
        method: "PUT",
        protected: true,
        data: {
          landingPageEnabled: isEnabled,
          content,
          ...(trailer ? { trailerPosterUrl: poster.imageUrl, trailerPosterId: poster.imageId } : {}),
        },
      },
    ]);
    const res = response[0];
    const page = res?.data?.data?.landingPage as CourseLandingPage | undefined;

    if (!res?.ok || !res.data?.success || !page) {
      const message = res?.data?.message ?? "Please try again.";
      setError(message);
      toast.add({ title: ERROR_MESSAGES.LANDING_PAGE_SAVE_FAILED_TITLE, description: message, type: "error" });
      return false;
    }

    const savedContent = mergeWithEmpty(page.content);
    const savedPoster = { imageUrl: page.trailer?.posterUrl ?? "", imageId: page.trailer?.posterId ?? "" };
    setLandingPage(page);
    setIsEnabled(page.landingPageEnabled);
    setContent(savedContent);
    setTrailer(page.trailer);
    setPoster(savedPoster);
    setSavedSnapshot(
      JSON.stringify({ isEnabled: page.landingPageEnabled, content: savedContent, poster: savedPoster }),
    );
    setUsedTemplate(false);
    toast.add({
      title: "Landing page saved",
      description: page.landingPageEnabled
        ? "The public course page shows these details once the course is published."
        : "This course has no public landing page.",
      type: "success",
    });
    return true;
  };

  useImperativeHandle(ref, () => ({ save }));

  if (isLoading) {
    return (
      <div className="flex min-h-60 items-center justify-center gap-2 text-sm text-slate-500">
        <LoaderCircle className="size-5 animate-spin" /> Loading landing page...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-4 px-4 py-5 sm:px-6 lg:px-6">
      <Card className="gap-0 py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-6">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Globe className="size-4" /> Public landing page
          </CardTitle>
          <p className="text-sm text-slate-500">
            Optional. A public page at /courses/{landingPage?.slug || "<course-url>"} where anyone can read about the
            course before buying it.
          </p>
        </CardHeader>
        <CardContent className="space-y-4 px-5 py-5 sm:px-6">
          <label className="flex cursor-pointer items-start gap-3" htmlFor="landing-page-enabled">
            <Checkbox
              checked={isEnabled}
              id="landing-page-enabled"
              onCheckedChange={(checked) => {
                setIsEnabled(checked === true);
                setError(null);
              }}
            />
            <span>
              <span className="block text-sm font-medium">Turn on the public landing page for this course</span>
              <span className="mt-1 block text-xs text-slate-500">
                When it&apos;s off, the course has no public page and course cards link to the normal course page. The
                content below is kept, so you can turn it on again later.
              </span>
            </span>
          </label>
          {isEnabled && previewUrl && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-slate-50 px-4 py-3 text-sm">
              <span className="truncate text-slate-600">{previewUrl}</span>
              {isPublished && !isDirty ? (
                <a
                  className="inline-flex items-center gap-1.5 font-medium text-slate-900 underline-offset-4 hover:underline"
                  href={previewUrl}
                  rel="noreferrer"
                  target="_blank">
                  Preview <ExternalLink className="size-4" />
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Info className="size-4" />
                  {isPublished
                    ? "Save this step to update the live page."
                    : "The page goes live once the course is published."}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {isEnabled && (
        <>
          {usedTemplate && (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <span className="flex items-start gap-2">
                <Sparkles className="mt-0.5 size-4 shrink-0" />
                We&apos;ve filled in a starting template from the course page design. Edit every section for this course
                before saving.
              </span>
              <button
                aria-label="Dismiss"
                className="rounded p-0.5 hover:bg-amber-100"
                onClick={() => setUsedTemplate(false)}
                type="button">
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="rounded-lg border bg-white px-4 py-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">How the page switches</p>
            <p className="mt-1">
              Texts with two boxes have a <strong>prelaunch</strong> version, shown while the prelaunch offer is running
              (with a countdown), and a <strong>live</strong> version, shown otherwise. It switches by itself at 12:00
              AM IST. Empty sections are hidden on the page.
            </p>
            <p className="mt-2 font-semibold text-slate-800">Placeholders you can use in any text</p>
            <ul className="mt-1 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
              {LANDING_PLACEHOLDERS.map(({ token, description }) => (
                <li key={token}>
                  <code className="rounded bg-slate-100 px-1">{token}</code> {description}
                </li>
              ))}
            </ul>
          </div>

          <EditorSection defaultOpen description="Thin bar at the very top of the page." title="1. Announcement bar">
            <PhaseTextField
              hint={`${HIGHLIGHT_HINT} Leave a version empty to hide the bar in that phase. After launch, a running discount is added to the end (“· Now 20% off”) unless the text already uses {discount}.`}
              id="announcement"
              label="Announcement"
              maxLength={TITLE}
              onChange={(value) => update("announcement", value)}
              value={content.announcement}
            />
          </EditorSection>

          <EditorSection
            defaultOpen
            description="Title, intro, countdown, buttons and the cover image."
            title="2. Hero">
            <PhaseTextField
              id="hero-badge"
              label="Badge above the title"
              maxLength={SHORT}
              onChange={(badge) => updateIn("hero", { badge })}
              value={content.hero.badge}
            />
            <TextField
              hint={`Leave empty to use the course title. ${HIGHLIGHT_HINT}`}
              id="hero-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("hero", { title })}
              value={content.hero.title}
            />
            <TextField
              id="hero-subtitle"
              label="Intro text"
              maxLength={TEXT}
              multiline
              onChange={(subtitle) => updateIn("hero", { subtitle })}
              value={content.hero.subtitle}
            />
            <TextField
              hint="Shown above the countdown, only while the prelaunch offer is running."
              id="hero-countdown"
              label="Countdown label"
              maxLength={SHORT}
              onChange={(countdownLabel) => updateIn("hero", { countdownLabel })}
              value={content.hero.countdownLabel}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="hero-primary"
                label="Main button"
                maxLength={SHORT}
                onChange={(primaryButton) => updateIn("hero", { primaryButton })}
                value={content.hero.primaryButton}
              />
              <TextField
                hint="Scrolls to the curriculum."
                id="hero-secondary"
                label="Second button"
                maxLength={SHORT}
                onChange={(secondaryButton) => updateIn("hero", { secondaryButton })}
                value={content.hero.secondaryButton}
              />
            </div>
            <TextListField
              hint="Up to 2 small labels on the cover image, e.g. “🧘 Beginner friendly”."
              id="hero-chips"
              items={content.hero.chips}
              label="Labels on the cover image"
              maxItems={2}
              maxLength={60}
              onChange={(chips) => updateIn("hero", { chips })}
            />
            <ImageField
              aspectClassName="aspect-[4/5]"
              hint="Shown on the right of the hero. Without one, the course thumbnail is used."
              imageUrl={content.hero.coverImageUrl}
              label="Cover image"
              onChange={({ imageUrl, imageId }) => updateIn("hero", { coverImageUrl: imageUrl, coverImageId: imageId })}
            />
          </EditorSection>

          <EditorSection
            description="Tiles in a “Course at a glance” strip under the hero, e.g. “30 Days · Daily guided practice”."
            title="3. Stats tiles">
            <TextField
              hint="Small heading above the tiles. Leave empty to hide it."
              id="stats-title"
              label="Title"
              maxLength={SHORT}
              onChange={(statsTitle) => update("statsTitle", statsTitle)}
              placeholder="Course at a glance"
              value={content.statsTitle}
            />
            <ObjectListField
              emptyItem={{ icon: "", iconUrl: "", iconId: "", title: "", text: "" }}
              fields={[
                { key: "icon", label: "Icon", maxLength: 16, narrow: true, placeholder: "Emoji" },
                { key: "title", label: "Title", maxLength: 60 },
                { key: "text", label: "Text", maxLength: 120 },
              ]}
              hint={ICON_HINT}
              iconUpload={{ urlKey: "iconUrl", idKey: "iconId" }}
              itemLabel="Tile"
              items={content.stats}
              label="Tiles"
              onChange={(stats) => update("stats", stats)}
            />
          </EditorSection>

          <EditorSection
            description="Its own section under the hero: a 16:9 video with your thumbnail and a play button. Hidden until a trailer is uploaded and ready."
            title="4. Trailer">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="trailer-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("trailerSection", { title })}
              value={content.trailerSection.title}
            />
            <TextField
              id="trailer-text"
              label="Description"
              maxLength={TEXT}
              multiline
              onChange={(text) => updateIn("trailerSection", { text })}
              value={content.trailerSection.text}
            />
            <CourseTrailerField
              courseId={courseId}
              onPosterChange={setPoster}
              onRefresh={refreshTrailer}
              poster={poster}
              trailer={trailer}
            />
          </EditorSection>

          <EditorSection description="The problems this course solves." title="5. Pain points (“Sound familiar?”)">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="pain-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("painPoints", { title })}
              value={content.painPoints.title}
            />
            <TextField
              hint="Line under the title. Leave empty to hide it."
              id="pain-text"
              label="Description"
              maxLength={TEXT}
              multiline
              onChange={(text) => updateIn("painPoints", { text })}
              value={content.painPoints.text}
            />
            <ObjectListField
              emptyItem={{ icon: "", iconUrl: "", iconId: "", title: "", text: "" }}
              fields={[
                { key: "icon", label: "Icon", maxLength: 16, narrow: true, placeholder: "Emoji" },
                { key: "title", label: "Title", maxLength: 120 },
                { key: "text", label: "Text", maxLength: TEXT, multiline: true },
              ]}
              hint={ICON_HINT}
              iconUpload={{ urlKey: "iconUrl", idKey: "iconId" }}
              itemLabel="Card"
              items={content.painPoints.items}
              label="Cards"
              onChange={(items) => updateIn("painPoints", { items })}
            />
          </EditorSection>

          <EditorSection description="Numbered steps." title="6. How it works">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="how-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("howItWorks", { title })}
              value={content.howItWorks.title}
            />
            <TextField
              hint="Line under the title. Leave empty to hide it."
              id="how-text"
              label="Description"
              maxLength={TEXT}
              multiline
              onChange={(text) => updateIn("howItWorks", { text })}
              value={content.howItWorks.text}
            />
            <ObjectListField
              emptyItem={{ title: "", text: "" }}
              fields={[
                { key: "title", label: "Title", maxLength: 120 },
                { key: "text", label: "Text", maxLength: TEXT, multiline: true },
              ]}
              itemLabel="Step"
              items={content.howItWorks.steps}
              label="Steps"
              onChange={(steps) => updateIn("howItWorks", { steps })}
            />
          </EditorSection>

          <EditorSection
            description="Roadmap: one card per week on the left (one open at a time) and the open week's image on the right; then a button to the price card and a short note."
            title="7. Roadmap">
            <TextField
              hint="Small capitals above the title. Leave empty to hide it."
              id="gain-eyebrow"
              label="Label above the title"
              maxLength={SHORT}
              onChange={(eyebrow) => updateIn("benefits", { eyebrow })}
              placeholder="e.g. Your 4-week roadmap"
              value={content.benefits.eyebrow}
            />
            <TextField
              hint={HIGHLIGHT_HINT}
              id="gain-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("benefits", { title })}
              value={content.benefits.title}
            />
            <TextField
              id="gain-text"
              label="Text"
              maxLength={TEXT}
              multiline
              onChange={(text) => updateIn("benefits", { text })}
              value={content.benefits.text}
            />
            <ObjectListField
              emptyItem={{ title: "", text: "", pointsTitle: "", points: "", imageUrl: "", imageId: "" }}
              fields={[
                { key: "title", label: "Title", maxLength: 120, placeholder: "e.g. Week 1: Build the foundation" },
                { key: "text", label: "Short line under the title", maxLength: TEXT, multiline: true },
                {
                  key: "pointsTitle",
                  label: "Points heading (optional)",
                  maxLength: SHORT,
                  placeholder: "e.g. By the end of week 1:",
                },
                { key: "points", label: "Points (one per line)", maxLength: LONG, multiline: true },
              ]}
              hint="One card per week, in order; the first one starts open. Each line of “Points” becomes a ticked line. Add each week's image below."
              itemLabel="Week"
              items={content.benefits.weeks}
              label="Weeks"
              maxItems={12}
              onChange={(weeks) => updateIn("benefits", { weeks })}
            />
            {content.benefits.weeks.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Week images</p>
                <p className="text-xs text-slate-500">
                  16:9, shown on the right while that week is open.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {content.benefits.weeks.map((week, index) => (
                    <ImageField
                      aspectClassName="aspect-video"
                      imageUrl={week.imageUrl ?? ""}
                      key={index}
                      label={week.title.trim() || `Week ${index + 1}`}
                      onChange={(image) => updateWeekImage(index, image)}
                      requiredAspect={{ width: 16, height: 9, example: "1600 × 900 px" }}
                    />
                  ))}
                </div>
              </div>
            )}
            <TextField
              hint="Under the weeks; takes the visitor to the price card. Use {price} for the current price. Leave empty to hide the button."
              id="gain-button"
              label="Button"
              maxLength={SHORT}
              onChange={(button) => updateIn("benefits", { button })}
              value={content.benefits.button}
            />
            <TextField
              hint="One line at the end of the section, e.g. a safety note. Leave empty to hide it."
              id="gain-note"
              label="Note under the section"
              maxLength={TEXT}
              onChange={(note) => updateIn("benefits", { note })}
              value={content.benefits.note}
            />
          </EditorSection>

          <EditorSection
            description="Text on the left, the lessons in a card on the right. The lessons come from step 2; if the videos are grouped into weeks, the card shows them by week."
            title="8. Curriculum">
            <TextField
              hint={`Leave empty for “{lessonCount} lessons. *{totalDuration} total.*”. ${HIGHLIGHT_HINT}`}
              id="curriculum-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("curriculum", { title })}
              value={content.curriculum.title}
            />
            <TextField
              id="curriculum-text"
              label="Text"
              maxLength={TEXT}
              multiline
              onChange={(text) => updateIn("curriculum", { text })}
              value={content.curriculum.text}
            />
          </EditorSection>

          <EditorSection
            description="The price card: price, offer badge, steps, what's included and the button. The prices come from step 1."
            title="9. Pricing">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="price-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("pricing", { title })}
              value={content.pricing.title}
            />
            <PhaseTextField
              hint="Under the title."
              id="price-text"
              label="Text"
              maxLength={TEXT}
              onChange={(text) => updateIn("pricing", { text })}
              value={content.pricing.text}
            />
            <PhaseTextField
              hint="Top left of the card, only while an offer is running. Leave the live version empty if there's no discount after launch."
              id="price-badge"
              label="Offer badge"
              maxLength={SHORT}
              onChange={(badge) => updateIn("pricing", { badge })}
              value={content.pricing.badge}
            />
            <TextField
              id="price-steps-title"
              label="Steps box title"
              maxLength={SHORT}
              onChange={(stepsTitle) => updateIn("pricing", { stepsTitle })}
              value={content.pricing.stepsTitle}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <TextListField
                id="price-steps-prelaunch"
                items={content.pricing.steps.prelaunch}
                label="Steps while the prelaunch offer is running"
                maxItems={5}
                maxLength={TITLE}
                onChange={(prelaunch) => updateIn("pricing", { steps: { ...content.pricing.steps, prelaunch } })}
              />
              <TextListField
                id="price-steps-live"
                items={content.pricing.steps.live}
                label="Steps after launch"
                maxItems={5}
                maxLength={TITLE}
                onChange={(live) => updateIn("pricing", { steps: { ...content.pricing.steps, live } })}
              />
            </div>
            <TextListField
              hint={`Ticked list under the steps box, e.g. “30 daily videos, 10–12 min each”. ${HIGHLIGHT_HINT}`}
              id="price-features"
              items={content.pricing.features ?? []}
              label="What's included"
              maxItems={12}
              maxLength={TITLE}
              onChange={(features) => updateIn("pricing", { features })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="price-button"
                label="Button"
                maxLength={SHORT}
                onChange={(button) => updateIn("pricing", { button })}
                value={content.pricing.button}
              />
              <TextField
                hint="Under the price. The secure payment row under the button is always shown."
                id="price-note"
                label="Line under the price"
                maxLength={TITLE}
                onChange={(note) => updateIn("pricing", { note })}
                value={content.pricing.note}
              />
            </div>
          </EditorSection>

          <EditorSection title="10. Instructor">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="instructor-title"
              label="Name / title"
              maxLength={TITLE}
              onChange={(title) => updateIn("instructor", { title })}
              value={content.instructor.title}
            />
            <TextField
              id="instructor-bio"
              label="About the instructor"
              maxLength={LONG}
              multiline
              onChange={(bio) => updateIn("instructor", { bio })}
              value={content.instructor.bio}
            />
            <ObjectListField
              emptyItem={{ value: "", label: "" }}
              fields={[
                { key: "value", label: "Value", maxLength: 20, placeholder: "e.g. 8 yrs" },
                { key: "label", label: "Label", maxLength: 60, placeholder: "e.g. of practice" },
              ]}
              hint="Up to 4 small figures under the text."
              itemLabel="Figure"
              items={content.instructor.stats}
              label="Figures"
              maxItems={4}
              onChange={(stats) => updateIn("instructor", { stats })}
            />
            <TextField
              id="instructor-teaches-label"
              label="Tags heading"
              maxLength={SHORT}
              onChange={(teachesLabel) => updateIn("instructor", { teachesLabel })}
              placeholder="e.g. She teaches"
              value={content.instructor.teachesLabel}
            />
            <TextListField
              hint="Up to 8 styles or topics, shown as tags, e.g. “Hatha”, “Pranayama”."
              id="instructor-teaches"
              items={content.instructor.teaches}
              label="Tags"
              maxItems={8}
              maxLength={60}
              onChange={(teaches) => updateIn("instructor", { teaches })}
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <TextField
                hint="Shown in a highlighted box. Leave empty to hide it."
                id="instructor-quote"
                label="Quote"
                maxLength={TEXT}
                multiline
                onChange={(text) => updateIn("instructor", { quote: { ...content.instructor.quote, text } })}
                value={content.instructor.quote.text}
              />
              <TextField
                id="instructor-quote-author"
                label="Quote by"
                maxLength={80}
                onChange={(author) => updateIn("instructor", { quote: { ...content.instructor.quote, author } })}
                placeholder="e.g. Kratika"
                value={content.instructor.quote.author}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="instructor-primary-label"
                label="Main button"
                maxLength={SHORT}
                onChange={(label) =>
                  updateIn("instructor", { primaryButton: { ...content.instructor.primaryButton, label } })
                }
                placeholder="e.g. Book a call with Kratika"
                value={content.instructor.primaryButton.label}
              />
              <TextField
                hint={BUTTON_LINK_HINT}
                id="instructor-primary-url"
                label="Main button link"
                maxLength={1000}
                onChange={(url) => updateIn("instructor", { primaryButton: { ...content.instructor.primaryButton, url } })}
                value={content.instructor.primaryButton.url}
              />
              <TextField
                id="instructor-secondary-label"
                label="Second button"
                maxLength={SHORT}
                onChange={(label) =>
                  updateIn("instructor", { secondaryButton: { ...content.instructor.secondaryButton, label } })
                }
                placeholder="e.g. View her courses"
                value={content.instructor.secondaryButton.label}
              />
              <TextField
                hint={BUTTON_LINK_HINT}
                id="instructor-secondary-url"
                label="Second button link"
                maxLength={1000}
                onChange={(url) =>
                  updateIn("instructor", { secondaryButton: { ...content.instructor.secondaryButton, url } })
                }
                value={content.instructor.secondaryButton.url}
              />
            </div>
            <TextField
              id="instructor-button-note"
              label="Line beside the buttons"
              maxLength={SHORT}
              onChange={(buttonNote) => updateIn("instructor", { buttonNote })}
              placeholder="e.g. Free 15-min intro call"
              value={content.instructor.buttonNote}
            />
            <TextField
              hint="Small label on the photo. Leave empty to hide it."
              id="instructor-availability"
              label="Label on the photo"
              maxLength={80}
              onChange={(availability) => updateIn("instructor", { availability })}
              placeholder="e.g. Taking new students this month"
              value={content.instructor.availability}
            />
            <ImageField
              aspectClassName="aspect-[4/5]"
              hint="Portrait photo, shown at 4:5 on the left of the card. Keep the face in the upper part of the photo."
              imageUrl={content.instructor.imageUrl}
              requiredAspect={{ width: 4, height: 5, example: "1200 × 1500 px" }}
              label="Photo"
              onChange={({ imageUrl, imageId }) => updateIn("instructor", { imageUrl, imageId })}
            />
          </EditorSection>

          <EditorSection
            description="Feedback screenshots and quotes. Screenshots added here show only on this course; without any, the global ones from Instagram Feedback show."
            title="11. Student love">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="love-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("testimonials", { title })}
              value={content.testimonials.title}
            />
            <label className="flex cursor-pointer items-center gap-3 text-sm" htmlFor="love-screenshots">
              <Checkbox
                checked={content.testimonials.showScreenshots}
                id="love-screenshots"
                onCheckedChange={(checked) => updateIn("testimonials", { showScreenshots: checked === true })}
              />
              Show the Instagram feedback screenshots
            </label>
            {content.testimonials.showScreenshots && courseId && (
              <div className="rounded-lg border p-4">
                <InstagramFeedbackManager courseId={courseId} />
              </div>
            )}
            <ObjectListField
              emptyItem={{ text: "", name: "" }}
              fields={[
                { key: "text", label: "Quote", maxLength: TEXT, multiline: true },
                { key: "name", label: "Name", maxLength: 80 },
              ]}
              hint="Shown until the course has 3 written student reviews; from then on the 3 newest reviews show instead."
              itemLabel="Quote"
              items={content.testimonials.quotes}
              label="Quotes"
              maxItems={6}
              onChange={(quotes) => updateIn("testimonials", { quotes })}
            />
          </EditorSection>

          <EditorSection title="12. FAQ">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="faq-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("faq", { title })}
              value={content.faq.title}
            />
            <TextField
              hint="Line under the title. Leave empty for “A few helpful answers to make your first step feel simple.”"
              id="faq-text"
              label="Description"
              maxLength={TEXT}
              onChange={(text) => updateIn("faq", { text })}
              value={content.faq.text}
            />
            <ObjectListField
              emptyItem={{ question: "", answer: "" }}
              fields={[
                { key: "question", label: "Question", maxLength: TITLE },
                { key: "answer", label: "Answer", maxLength: LONG, multiline: true },
              ]}
              itemLabel="Question"
              items={content.faq.items}
              label="Questions"
              maxItems={20}
              onChange={(items) => updateIn("faq", { items })}
            />
          </EditorSection>

          <EditorSection
            description="Dark section at the end, plus the bar at the bottom on phones."
            title="13. Final call to action">
            <TextField
              hint={HIGHLIGHT_HINT}
              id="final-title"
              label="Title"
              maxLength={TITLE}
              onChange={(title) => updateIn("finalCta", { title })}
              value={content.finalCta.title}
            />
            <TextField
              id="final-text"
              label="Text"
              maxLength={TEXT}
              onChange={(text) => updateIn("finalCta", { text })}
              value={content.finalCta.text}
            />
            <TextField
              id="final-button"
              label="Button"
              maxLength={SHORT}
              onChange={(button) => updateIn("finalCta", { button })}
              value={content.finalCta.button}
            />
            <TextField
              hint="Phones show a bar at the bottom with the price, this text and an Enroll button."
              id="mobile-bar"
              label="Text under the price in the phone bar"
              maxLength={80}
              onChange={(subtitle) => update("mobileBar", { subtitle })}
              value={content.mobileBar.subtitle}
            />
          </EditorSection>

          <EditorSection
            description="How the page looks in Google results and when the link is shared (WhatsApp, Instagram, X…). Empty fields use the course title, intro text and cover image."
            title="14. SEO & sharing">
            <TextField
              hint="Shown as the page title in Google and the browser tab. Keep it under 60 characters."
              id="seo-title"
              label="Meta title"
              maxLength={70}
              onChange={(title) => updateIn("seo", { title })}
              placeholder="e.g. 30 Days to Full Mobility | Kratika Yoga"
              value={content.seo.title}
            />
            <TextField
              hint="Shown under the title in Google and in link previews. Aim for 120–160 characters."
              id="seo-description"
              label="Meta description"
              maxLength={160}
              multiline
              onChange={(description) => updateIn("seo", { description })}
              placeholder="e.g. A gentle 30-day yoga course to unlock your hips, spine and shoulders. 10–12 minutes a day, beginner friendly."
              value={content.seo.description}
            />
            <ImageField
              aspectClassName="aspect-[1200/630]"
              hint="The preview image when the link is shared. It must be exactly 1200 × 630 px."
              imageUrl={content.seo.imageUrl}
              label="Meta image"
              onChange={({ imageUrl, imageId }) => updateIn("seo", { imageUrl, imageId })}
              requiredSize={{ width: 1200, height: 630 }}
            />
          </EditorSection>

          <div className="flex justify-end">
            <Button
              className="h-10"
              onClick={() => {
                if (
                  window.confirm(
                    "Replace every section with the starting template? Your unsaved and saved text in this step will be overwritten when you save.",
                  )
                ) {
                  // SEO isn't page text, so the reset keeps it.
                  setContent((current) => ({ ...structuredClone(LANDING_CONTENT_TEMPLATE), seo: current.seo }));
                }
              }}
              type="button"
              variant="outline">
              Reset to the starting template
            </Button>
          </div>
        </>
      )}

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default CourseLandingStep;

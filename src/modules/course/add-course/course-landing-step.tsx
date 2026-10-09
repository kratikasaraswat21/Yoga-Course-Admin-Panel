import { ExternalLink, Globe, Info, LoaderCircle, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/variants/toast.manager";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { EnvConfig } from "@/utils/config/envConfig";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import type { CourseLandingContent, CourseLandingPage, CourseTrailer } from "./add-course.types";
import {
  EMPTY_LANDING_CONTENT,
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

const HIGHLIGHT_HINT = "Wrap words in *asterisks* to highlight them.";

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
  if (content.testimonials.quotes.some((quote) => quote.name.trim() && !quote.text.trim())) {
    return "Every student quote needs the quote text.";
  }
  const needsTitle = [
    ["stat tile", content.stats],
    ["pain point", content.painPoints.items],
    ["'How it works' step", content.howItWorks.steps],
  ] as const;
  for (const [label, items] of needsTitle) {
    if (items.some((item) => Object.values(item).some((value) => value.trim()) && !item.title.trim())) {
      return `Every ${label} needs a title.`;
    }
  }
  return null;
};

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
  const updateIn = <Key extends keyof CourseLandingContent>(key: Key, patch: Partial<CourseLandingContent[Key]>) => {
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
              hint={`${HIGHLIGHT_HINT} Leave a version empty to hide the bar in that phase.`}
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
            description="Its own section under the hero: a 16:9 video with your thumbnail and a play button. Hidden until a trailer is uploaded and ready."
            title="3. Trailer">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="trailer-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("trailerSection", { eyebrow })}
                value={content.trailerSection.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="trailer-title"
                label="Title"
                maxLength={TITLE}
                onChange={(title) => updateIn("trailerSection", { title })}
                value={content.trailerSection.title}
              />
            </div>
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

          <EditorSection
            description="Up to 6 tiles in the hero, under the buttons (3 per row), e.g. “30 Days · Daily guided practice”."
            title="4. Stats tiles">
            <ObjectListField
              emptyItem={{ icon: "", title: "", text: "" }}
              fields={[
                { key: "icon", label: "Icon", maxLength: 16, narrow: true, placeholder: "Emoji" },
                { key: "title", label: "Title", maxLength: 60 },
                { key: "text", label: "Text", maxLength: 120 },
              ]}
              itemLabel="Tile"
              items={content.stats}
              label="Tiles"
              maxItems={6}
              onChange={(stats) => update("stats", stats)}
            />
          </EditorSection>

          <EditorSection description="The problems this course solves." title="5. Pain points (“Sound familiar?”)">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="pain-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("painPoints", { eyebrow })}
                value={content.painPoints.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="pain-title"
                label="Title"
                maxLength={TITLE}
                onChange={(title) => updateIn("painPoints", { title })}
                value={content.painPoints.title}
              />
            </div>
            <ObjectListField
              emptyItem={{ icon: "", title: "", text: "" }}
              fields={[
                { key: "icon", label: "Icon", maxLength: 16, narrow: true, placeholder: "Emoji" },
                { key: "title", label: "Title", maxLength: 120 },
                { key: "text", label: "Text", maxLength: TEXT, multiline: true },
              ]}
              itemLabel="Card"
              items={content.painPoints.items}
              label="Cards"
              maxItems={6}
              onChange={(items) => updateIn("painPoints", { items })}
            />
          </EditorSection>

          <EditorSection description="Up to 4 numbered steps." title="6. How it works">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="how-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("howItWorks", { eyebrow })}
                value={content.howItWorks.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="how-title"
                label="Title"
                maxLength={TITLE}
                onChange={(title) => updateIn("howItWorks", { title })}
                value={content.howItWorks.title}
              />
            </div>
            <ObjectListField
              emptyItem={{ title: "", text: "" }}
              fields={[
                { key: "title", label: "Title", maxLength: 120 },
                { key: "text", label: "Text", maxLength: TEXT, multiline: true },
              ]}
              itemLabel="Step"
              items={content.howItWorks.steps}
              label="Steps"
              maxItems={4}
              onChange={(steps) => updateIn("howItWorks", { steps })}
            />
          </EditorSection>

          <EditorSection description="Dark section with a checklist." title="7. What you'll gain">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="gain-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("benefits", { eyebrow })}
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
            </div>
            <TextField
              id="gain-text"
              label="Text"
              maxLength={TEXT}
              multiline
              onChange={(text) => updateIn("benefits", { text })}
              value={content.benefits.text}
            />
            <TextListField
              id="gain-items"
              items={content.benefits.items}
              label="Checklist"
              maxItems={12}
              maxLength={TITLE}
              onChange={(items) => updateIn("benefits", { items })}
            />
          </EditorSection>

          <EditorSection
            description="Text on the left, the lessons in a card on the right. The lessons come from step 2; if the videos are grouped into weeks, the card shows them by week."
            title="8. Curriculum">
            <TextField
              id="curriculum-eyebrow"
              label="Small heading"
              maxLength={SHORT}
              onChange={(eyebrow) => updateIn("curriculum", { eyebrow })}
              value={content.curriculum.eyebrow}
            />
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
            description="The price card: offer badge, countdown, price, steps, what's included and the button. The prices come from step 1."
            title="9. Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="price-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("pricing", { eyebrow })}
                value={content.pricing.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="price-title"
                label="Title"
                maxLength={TITLE}
                onChange={(title) => updateIn("pricing", { title })}
                value={content.pricing.title}
              />
            </div>
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
              id="price-includes"
              items={content.pricing.includes}
              label="Everything included"
              maxItems={10}
              maxLength={TITLE}
              onChange={(includes) => updateIn("pricing", { includes })}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="instructor-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("instructor", { eyebrow })}
                value={content.instructor.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="instructor-title"
                label="Name / title"
                maxLength={TITLE}
                onChange={(title) => updateIn("instructor", { title })}
                value={content.instructor.title}
              />
            </div>
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
            <ImageField
              aspectClassName="aspect-[4/5]"
              hint="Fills the left side of the card. A portrait or action photo works best."
              imageUrl={content.instructor.imageUrl}
              label="Photo"
              onChange={({ imageUrl, imageId }) => updateIn("instructor", { imageUrl, imageId })}
            />
          </EditorSection>

          <EditorSection description="Feedback screenshots and quotes." title="11. Student love">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="love-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("testimonials", { eyebrow })}
                value={content.testimonials.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="love-title"
                label="Title"
                maxLength={TITLE}
                onChange={(title) => updateIn("testimonials", { title })}
                value={content.testimonials.title}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm" htmlFor="love-screenshots">
              <Checkbox
                checked={content.testimonials.showScreenshots}
                id="love-screenshots"
                onCheckedChange={(checked) => updateIn("testimonials", { showScreenshots: checked === true })}
              />
              Show the Instagram feedback screenshots
            </label>
            <ObjectListField
              emptyItem={{ text: "", name: "" }}
              fields={[
                { key: "text", label: "Quote", maxLength: TEXT, multiline: true },
                { key: "name", label: "Name", maxLength: 80 },
              ]}
              itemLabel="Quote"
              items={content.testimonials.quotes}
              label="Quotes"
              maxItems={6}
              onChange={(quotes) => updateIn("testimonials", { quotes })}
            />
          </EditorSection>

          <EditorSection title="12. FAQ">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="faq-eyebrow"
                label="Small heading"
                maxLength={SHORT}
                onChange={(eyebrow) => updateIn("faq", { eyebrow })}
                value={content.faq.eyebrow}
              />
              <TextField
                hint={HIGHLIGHT_HINT}
                id="faq-title"
                label="Title"
                maxLength={TITLE}
                onChange={(title) => updateIn("faq", { title })}
                value={content.faq.title}
              />
            </div>
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

          <div className="flex justify-end">
            <Button
              className="h-10"
              onClick={() => {
                if (
                  window.confirm(
                    "Replace every section with the starting template? Your unsaved and saved text in this step will be overwritten when you save.",
                  )
                ) {
                  setContent(structuredClone(LANDING_CONTENT_TEMPLATE));
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

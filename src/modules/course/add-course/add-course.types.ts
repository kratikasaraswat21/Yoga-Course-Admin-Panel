export type AddCourseStep = 1 | 2 | 3 | 4;
export type CourseVideoStatus = "Processing" | "Ready";

export interface AddCourseDetails {
  title: string;
  /** Public landing page URL: /courses/<slug>. Auto-filled from the title until edited. */
  slug: string;
  description: string;
  price: string;
  discountPercentage: string;
  roundPayableAmount: boolean;
  thumbnailURL: string;
  thumbnailId: string;
  prelaunchEnabled: boolean;
  /** YYYY-MM-DD (IST). The offer starts at 12:00 AM IST on this day. */
  prelaunchStartDate: string;
  /** YYYY-MM-DD (IST). The offer ends at 12:00 AM IST on this day. */
  prelaunchEndDate: string;
  prelaunchDiscount: string;
  /** Buyers must complete each video before the next one opens. */
  sequentialUnlock: boolean;
}

/** A text with one version for the prelaunch phase and one for after launch. */
export interface PhaseText {
  prelaunch: string;
  live: string;
}

/** A stat tile or pain point card. An uploaded icon (iconUrl, e.g. an SVG) is shown instead of the emoji. */
export interface LandingIconItem {
  icon: string;
  iconUrl: string;
  iconId: string;
  title: string;
  text: string;
}

/** Every editable section of the public course landing page. Mirrors the backend schema. */
export interface CourseLandingContent {
  announcement: PhaseText;
  hero: {
    badge: PhaseText;
    title: string;
    subtitle: string;
    countdownLabel: string;
    primaryButton: string;
    secondaryButton: string;
    chips: string[];
    coverImageUrl: string;
    coverImageId: string;
  };
  /** Section under the hero with the course trailer. */
  trailerSection: { title: string; text: string };
  /** Small heading above the stat tiles, e.g. "Course at a glance". Empty hides it. */
  statsTitle: string;
  stats: LandingIconItem[];
  painPoints: { title: string; text: string; items: LandingIconItem[] };
  howItWorks: { title: string; text: string; steps: { title: string; text: string }[] };
  benefits: { title: string; text: string; items: string[] };
  curriculum: { title: string; text: string };
  pricing: {
    title: string;
    /** Line under the title; differs before and after launch. */
    text: PhaseText;
    badge: PhaseText;
    stepsTitle: string;
    steps: { prelaunch: string[]; live: string[] };
    button: string;
    /** Line under the price. */
    note: string;
  };
  instructor: {
    title: string;
    bio: string;
    imageUrl: string;
    imageId: string;
    /** Small figures under the bio, e.g. { value: "8 yrs", label: "of practice" }. */
    stats: { value: string; label: string }[];
    /** Small label on the photo, e.g. "Taking new students this month". */
    availability: string;
    /** Heading above the tags, e.g. "She teaches". */
    teachesLabel: string;
    teaches: string[];
    quote: { text: string; author: string };
    /** Each button shows only with both a label and a link (https://, /path, #section, mailto: or tel:). */
    primaryButton: { label: string; url: string };
    secondaryButton: { label: string; url: string };
    /** Short line beside the buttons, e.g. "Free 15-min intro call". */
    buttonNote: string;
  };
  testimonials: { title: string; showScreenshots: boolean; quotes: { text: string; name: string }[] };
  faq: { title: string; text: string; items: { question: string; answer: string }[] };
  finalCta: { title: string; text: string; button: string };
  mobileBar: { subtitle: string };
  /** Search results and link previews; empty fields fall back to the course title, intro and cover image. */
  seo: { title: string; description: string; imageUrl: string; imageId: string };
}

export interface CourseTrailer {
  videoUid: string;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "ERROR" | null;
  fileName: string | null;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  posterUrl: string | null;
  posterId: string | null;
}

export interface CourseLandingPage {
  courseId: string;
  title: string;
  slug: string;
  status: string;
  landingPageEnabled: boolean;
  content: CourseLandingContent;
  trailer: CourseTrailer | null;
}

/** A week/group of videos, e.g. "Week 1: Foundations". */
export interface CourseVideoGroup {
  id: string;
  title: string;
  description: string | null;
  sortOrder: number;
  videoIds: string[];
}

export interface CourseVideo {
  id: string;
  cloudflareVideoUid?: string;
  createdAt?: string;
  dashUrl?: string;
  description?: string;
  durationSeconds?: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  fileSize?: string;
  fileType?: string;
  height?: number;
  hlsUrl?: string;
  isCustomThumbnail?: boolean;
  originalFileName: string;
  processingPercentage?: number;
  readyToStream?: boolean;
  /** YYYY-MM-DD (IST) release date, or null when the video is visible as soon as it is ready. */
  releaseDate?: string | null;
  isScheduled?: boolean;
  groupId?: string | null;
  sortOrder?: number;
  title: string;
  status: CourseVideoStatus;
  thumbnailId?: string;
  thumbnailUrl?: string;
  updatedAt?: string;
  width?: number;
  yogaCourseId?: string;
}

export interface CourseVideoConfiguration {
  file: File;
  durationSeconds: number;
  formData: CourseVideoFormData;
  videoId?: string;
}

export interface CourseVideoFormData {
  title: string;
  description: string;
  thumbnailType: "custom";
  thumbnailUrl: string;
  thumbnailId: string;
  thumbnailFile?: File;
  /** YYYY-MM-DD (IST), or "" for "visible as soon as processing finishes". */
  releaseDate: string;
  /** Group (week) ID, or "" for no group. */
  groupId: string;
}

export interface AddCourseDraft {
  courseId: string;
  step: AddCourseStep;
  details: AddCourseDetails;
  videos: CourseVideo[];
}

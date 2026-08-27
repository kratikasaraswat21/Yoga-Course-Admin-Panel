export type AddCourseStep = 1 | 2 | 3;
export type CourseVideoStatus = "Processing" | "Ready";

export interface AddCourseDetails {
  title: string;
  description: string;
  price: string;
  discountPercentage: string;
  roundPayableAmount: boolean;
  thumbnailURL: string;
  thumbnailId: string;
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
}

export interface AddCourseDraft {
  courseId: string;
  step: AddCourseStep;
  details: AddCourseDetails;
  videos: CourseVideo[];
}

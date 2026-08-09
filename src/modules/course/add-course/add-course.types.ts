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
  fileName: string;
  title: string;
  status: CourseVideoStatus;
  durationSeconds?: number;
}

export interface CourseVideoConfiguration {
  file: File;
  durationSeconds: number;
  formData: CourseVideoFormData;
}

export interface CourseVideoFormData {
  title: string;
  description: string;
  thumbnailType: "automatic" | "custom";
  thumbnailUrl: string;
  thumbnailUrlId: string;
  thumbnailFile?: File;
}

export interface AddCourseDraft {
  courseId: string;
  step: AddCourseStep;
  details: AddCourseDetails;
  videos: CourseVideo[];
}

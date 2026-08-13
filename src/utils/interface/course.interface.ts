export type CourseStatus = "Draft" | "Published" | "Archived";
export type VideoThumbnailMode = "automatic" | "custom";

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  payableAmount: number;
  roundPayableAmount: boolean;
  status: CourseStatus;
  students: number;
  coverImageName: string;
  thumbnailUrl?: string;
  videoFileName: string;
  videoThumbnailMode: VideoThumbnailMode;
  videoThumbnailName: string;
  updatedAt: string;
}

export interface CourseFormData {
  title: string;
  description: string;
  price: string;
  discountPercentage: string;
  roundPayableAmount: boolean;
  coverImageName: string;
  videoFileName: string;
  videoThumbnailMode: VideoThumbnailMode;
  videoThumbnailName: string;
}

export type CourseFormErrors = Partial<Record<keyof CourseFormData, string>>;

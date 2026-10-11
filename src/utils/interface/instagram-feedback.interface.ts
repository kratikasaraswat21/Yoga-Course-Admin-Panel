export interface InstagramFeedbackImage {
  id: string;
  imageUrl: string;
  publicId: string;
  altText: string | null;
  /** Null for a global image, otherwise the course it belongs to. */
  courseId: string | null;
  sortOrder: number;
  createdAt: string;
}

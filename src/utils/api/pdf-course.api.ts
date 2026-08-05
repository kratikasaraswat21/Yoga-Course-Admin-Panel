import { multipleApiHandler, type ApiReturnInterface } from "@/utils/api/multiple.api";

export interface ReorderPdfCoursesPayload {
  courseId: string;
  sortOrder: number;
  orderedIds: string[];
}

export const reorderPdfCourses = async (payload: ReorderPdfCoursesPayload): Promise<ApiReturnInterface> => {
  console.log(payload);
  const response = await multipleApiHandler([
    {
      endPoint: "/pdf-course/reorder",
      method: "PUT",
      protected: true,
      data: payload,
    },
  ]);

  return response[0];
};

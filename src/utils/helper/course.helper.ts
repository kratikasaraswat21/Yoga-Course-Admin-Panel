import type { Course, CourseFormData } from "@/utils/interface/course.interface";
import { MOCK_COURSES } from "@/utils/mock/course.mock";

const MOCK_COURSE_STORAGE_KEY = "adminPanelMockCourses";

export const formatCoursePrice = (price: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(price);

export const formatCourseDate = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));

export const calculatePayableAmount = (price: number, discountPercentage: number, roundAmount: boolean) => {
  const discountedAmount = price - (price * discountPercentage) / 100;
  return roundAmount ? Math.round(discountedAmount) : Math.round(discountedAmount * 100) / 100;
};

export const normalizeNonNegativeDecimalInput = (value: string, maximumValue?: number) => {
  if (!value) return "";
  if (!/^\d*\.?\d{0,2}$/.test(value)) return null;

  const [integerPart = "", decimalPart] = value.split(".");
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, "") || "0";
  const normalizedValue = decimalPart === undefined ? normalizedInteger : `${normalizedInteger}.${decimalPart}`;

  if (maximumValue !== undefined && Number(normalizedValue) > maximumValue) {
    return String(maximumValue);
  }

  return normalizedValue;
};

export const convertCourseToFormData = (course: Course): CourseFormData => ({
  title: course.title,
  description: course.description,
  price: String(course.price),
  discountPercentage: String(course.discountPercentage ?? 0),
  roundPayableAmount: course.roundPayableAmount ?? false,
  coverImageName: course.coverImageName ?? "",
  videoFileName: course.videoFileName ?? "",
  videoThumbnailMode: course.videoThumbnailMode ?? "automatic",
  videoThumbnailName: course.videoThumbnailName ?? "",
});

const normalizeCourse = (course: Course): Course => {
  const price = Number(course.price) || 0;
  const discountPercentage = Number(course.discountPercentage) || 0;
  const roundPayableAmount = course.roundPayableAmount ?? false;

  return {
    ...course,
    price,
    discountPercentage,
    roundPayableAmount,
    payableAmount: calculatePayableAmount(price, discountPercentage, roundPayableAmount),
    coverImageName: course.coverImageName ?? "",
    videoFileName: course.videoFileName ?? "",
    videoThumbnailMode: course.videoThumbnailMode ?? "automatic",
    videoThumbnailName: course.videoThumbnailName ?? "",
  };
};

export const getMockCourses = (): Course[] => {
  try {
    const storedCourses = localStorage.getItem(MOCK_COURSE_STORAGE_KEY);
    if (!storedCourses) return MOCK_COURSES;

    const parsedCourses = JSON.parse(storedCourses);
    return Array.isArray(parsedCourses) ? parsedCourses.map(normalizeCourse) : MOCK_COURSES;
  } catch {
    return MOCK_COURSES;
  }
};

export const storeMockCourses = (courses: Course[]) => {
  localStorage.setItem(MOCK_COURSE_STORAGE_KEY, JSON.stringify(courses));
};

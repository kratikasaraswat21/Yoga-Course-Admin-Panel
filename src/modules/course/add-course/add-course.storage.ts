import type { AddCourseDraft, AddCourseStep } from "./add-course.types";

export const ADD_COURSE_DRAFT_KEY = "yoga-admin-add-course-draft";

export function readAddCourseDraft(): AddCourseDraft | null {
  try {
    const value = window.localStorage.getItem(ADD_COURSE_DRAFT_KEY);
    if (!value) return null;
    return JSON.parse(value) as AddCourseDraft;
  } catch {
    return null;
  }
}

export function saveAddCourseDraft(draft: AddCourseDraft) {
  window.localStorage.setItem(ADD_COURSE_DRAFT_KEY, JSON.stringify(draft));
}

export function updateAddCourseStep(step: AddCourseStep) {
  const draft = readAddCourseDraft();
  if (draft) saveAddCourseDraft({ ...draft, step });
}

export function clearAddCourseDraft() {
  window.localStorage.removeItem(ADD_COURSE_DRAFT_KEY);
}

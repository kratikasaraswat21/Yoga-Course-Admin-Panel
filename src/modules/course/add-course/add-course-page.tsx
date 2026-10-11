import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/variants/toast.manager";

import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { validateAddCourseDetails, type AddCourseDetailsErrors } from "@/utils/validation/course.validation";
import { LoaderCircle, X } from "lucide-react";
import AddCourseStepper from "./add-course-stepper";
import { clearAddCourseDraft } from "./add-course.storage";
import type { AddCourseDetails, AddCourseDraft, AddCourseStep } from "./add-course.types";
import CourseDetailsStep from "./course-details-step";
import CourseLandingStep, { type CourseLandingStepHandle } from "./course-landing-step";
import CourseReviewStep from "./course-review-step";
import CourseVideosStep from "./course-videos-step";

const emptyDetails: AddCourseDetails = {
  title: "",
  slug: "",
  description: "",
  price: "0",
  discountPercentage: "0",
  roundPayableAmount: false,
  thumbnailURL: "",
  thumbnailId: "",
  prelaunchEnabled: false,
  prelaunchStartDate: "",
  prelaunchEndDate: "",
  prelaunchDiscount: "",
  sequentialUnlock: false,
};

const PRELAUNCH_ERROR_KEYS = ["prelaunchStartDate", "prelaunchEndDate", "prelaunchDiscount"] as const;

// Prelaunch fields sent with step one. Disabled means "no prelaunch" and clears it on the server.
// The "Lock videos in order" switch is sent with them.
const getPrelaunchPayload = (details: AddCourseDetails) => ({
  sequentialUnlock: details.sequentialUnlock,
  prelaunchEnabled: details.prelaunchEnabled,
  ...(details.prelaunchEnabled
    ? {
        prelaunchStartDate: details.prelaunchStartDate,
        prelaunchEndDate: details.prelaunchEndDate,
        prelaunchDiscount: details.prelaunchDiscount,
      }
    : {}),
});

function AddCoursePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCourseId = searchParams.get("courseId") ?? searchParams.get("id") ?? "";
  const isEditing = Boolean(urlCourseId);
  const urlStep = Number(searchParams.get("step"));
  const stepFromUrl: AddCourseStep | null =
    urlStep === 1 || urlStep === 2 || urlStep === 3 || urlStep === 4 ? urlStep : null;
  const [draft, setDraft] = useState<AddCourseDraft>(() => {
    return { courseId: urlCourseId, step: stepFromUrl ?? (1 as AddCourseStep), details: emptyDetails, videos: [] };
  });
  const [savedStepOneDetails, setSavedStepOneDetails] = useState(() => draft.details);
  const [showInfo, setShowInfo] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [errors, setErrors] = useState<AddCourseDetailsErrors>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSavingLandingPage, setIsSavingLandingPage] = useState(false);
  const landingStepRef = useRef<CourseLandingStepHandle>(null);

  const currentStep = stepFromUrl ?? draft.step;
  const hasStepOneChanges = JSON.stringify(draft.details) !== JSON.stringify(savedStepOneDetails);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    let shouldReplaceUrl = false;

    if (nextParams.get("courseId") !== draft.courseId) {
      if (draft.courseId) nextParams.set("courseId", draft.courseId);
      else nextParams.delete("courseId");
      nextParams.delete("id");
      shouldReplaceUrl = true;
    }

    if (nextParams.get("step") !== String(currentStep)) {
      nextParams.set("step", String(currentStep));
      shouldReplaceUrl = true;
    }

    if (shouldReplaceUrl) setSearchParams(nextParams, { replace: true });
  }, [currentStep, draft.courseId, searchParams, setSearchParams]);

  useEffect(() => {
    clearAddCourseDraft();
  }, []);

  useEffect(() => {
    const confirmBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", confirmBeforeLeave);
    return () => window.removeEventListener("beforeunload", confirmBeforeLeave);
  }, []);

  const setStep = (step: AddCourseStep) => {
    setSearchParams((current) => {
      const nextParams = new URLSearchParams(current);
      nextParams.set("step", String(step));
      return nextParams;
    });
  };

  const handelSaveAsDraftFunction = async () => {
    // A draft can be incomplete: only send the URL and prelaunch fields when they are valid, otherwise keep what's saved.
    const { errors: draftErrors } = validateAddCourseDetails(draft.details, savedStepOneDetails.prelaunchStartDate);
    const canSavePrelaunch = PRELAUNCH_ERROR_KEYS.every((key) => !draftErrors[key]);

    try {
      const response = await multipleApiHandler([
        {
          endPoint: draft?.courseId ? `/course/edit/${draft?.courseId}` : "/course/add/step-one",
          protected: true,
          data: {
            title: draft?.details?.title?.trim() ? draft?.details?.title : "-",
            description: draft?.details?.description?.trim() ? draft?.details?.description : "-",
            price: draft?.details?.price ?? "0",
            discountPercentage: draft?.details?.discountPercentage ?? "0",
            roundPayableAmount: false,
            thumbnailURL: draft?.details?.thumbnailURL?.trim() ? draft?.details?.thumbnailURL : "-",
            thumbnailId: draft?.details?.thumbnailId?.trim() ? draft?.details?.thumbnailId : "-",
            ...(draft.details.slug && !draftErrors.slug ? { slug: draft.details.slug } : {}),
            ...(canSavePrelaunch ? getPrelaunchPayload(draft.details) : {}),
          },
          method: "POST",
        },
      ]);

      const res = response[0];

      if (!res?.data?.success) {
        toast.add({
          title: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_TITLE,
          description: res?.data?.message ?? ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_DESCRIPTION,
          type: "error",
        });
        return false;
      }

      const savedCourseId = res.data.data?.course_id ?? draft.courseId;
      setDraft((current) => ({ ...current, courseId: savedCourseId }));

      toast.add({
        title: SUCCESS_MESSAGES.COURSE_DETAILS_SAVED_TITLE,
        description: SUCCESS_MESSAGES.COURSE_DETAILS_SAVED_DESCRIPTION,
        type: "success",
      });
      return true;
    } catch {
      toast.add({
        title: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_TITLE,
        description: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_DESCRIPTION,
        type: "error",
      });
      return false;
    }
  };

  const saveAndLeave = async () => {
    if (isSavingDraft) return;
    setIsSavingDraft(true);
    const didSave = await handelSaveAsDraftFunction();
    setIsSavingDraft(false);
    if (didSave) navigate("/course");
  };
  const stopProcess = () => {
    clearAddCourseDraft();
    navigate("/course");
  };

  const handleCancel = () => {
    const hasCourseDetails = Object.entries(draft.details).some(([key, value]) => {
      if (key === "price" || key === "discountPercentage") return Number(value) > 0;
      if (typeof value === "boolean") return value;
      return String(value).trim().length > 0;
    });

    if (hasCourseDetails || draft.videos.length > 0) {
      setShowCancelDialog(true);
      return;
    }

    stopProcess();
  };
  const handleVideosChange = useCallback((videos: AddCourseDraft["videos"]) => {
    setDraft((current) => ({ ...current, videos }));
  }, []);

  const handelSaveMoveToNextStep = useDebounce(async () => {
    try {
      const response = await multipleApiHandler([
        {
          endPoint: draft?.courseId ? `/course/edit/${draft?.courseId}` : "/course/add/step-one",
          protected: true,
          data: {
            title: draft.details.title,
            slug: draft.details.slug,
            description: draft.details.description,
            price: draft.details.price,
            discountPercentage: draft.details.discountPercentage,
            roundPayableAmount: draft.details.roundPayableAmount,
            thumbnailURL: draft.details.thumbnailURL,
            thumbnailId: draft.details.thumbnailId,
            ...getPrelaunchPayload(draft.details),
            ...(draft.courseId ? { courseId: draft.courseId } : {}),
          },
          method: "POST",
        },
      ]);

      const res = response[0];

      if (!res?.data?.success || !res.data.data?.course_id) {
        const message = res?.data?.message;
        if (res?.status === 409 && message) setErrors({ slug: message });
        toast.add({
          title: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_TITLE,
          description: message ?? ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_DESCRIPTION,
          type: "error",
        });
        return;
      }

      toast.add({
        title: SUCCESS_MESSAGES.COURSE_DETAILS_SAVED_TITLE,
        description: SUCCESS_MESSAGES.COURSE_DETAILS_SAVED_DESCRIPTION,
        type: "success",
      });

      const savedDetails = { ...draft.details, slug: String(res.data.data.slug ?? draft.details.slug) };
      setSavedStepOneDetails(savedDetails);
      setDraft((pervData) => ({ ...pervData, courseId: res?.data?.data?.course_id, details: savedDetails }));
      setStep(2);

      setSearchParams((current) => {
        const nextParams = new URLSearchParams(current);
        nextParams.set("step", String(2));
        return nextParams;
      });
    } catch {
      toast.add({
        title: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_TITLE,
        description: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_DESCRIPTION,
        type: "error",
      });
    }
  }, 100);

  const handleSaveAndContinue = () => {
    const validation = validateAddCourseDetails(draft.details, savedStepOneDetails.prelaunchStartDate);
    setErrors(validation.errors);
    if (!validation.isValid) return;

    if (!hasStepOneChanges) {
      setStep(2);
      return;
    }

    handelSaveMoveToNextStep();
  };

  const publishCourseFunction = useDebounce(async (course_id: string, courseTitle: string) => {
    try {
      const response = await multipleApiHandler([
        {
          endPoint: `/course/publish/${course_id}`,
          method: "PATCH",
          protected: true,
        },
      ]);

      const res = response[0];

      toast.add({
        title: res?.data?.success ? `${courseTitle} published` : `${courseTitle} Unable to publish`,
        description: res?.data?.message ?? (res?.data?.success ? "The course is now live." : "Please try again."),
        type: res?.data?.success ? "success" : "error",
      });

      if (res?.data?.success) {
        navigate("/course");
      }
    } catch {
      toast.add({
        title: `${courseTitle} Unable to publish`,
        description: "Please check your connection and try again.",
        type: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  }, 100);

  const handleSaveLandingPage = async () => {
    if (isSavingLandingPage) return;
    setIsSavingLandingPage(true);
    try {
      const didSave = (await landingStepRef.current?.save()) ?? false;
      if (didSave) setStep(4);
    } finally {
      setIsSavingLandingPage(false);
    }
  };

  const handelPublishCourse = (courseId: string, courseTitle = draft.details.title.trim() || "Course") => {
    if (!courseId || isPublishing) return;
    setIsPublishing(true);
    publishCourseFunction(courseId, courseTitle);
  };

  return (
    <section className="flex min-h-[calc(100dvh-75px)] flex-col bg-white">
      <header className="border-b border-slate-200 px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1580px]">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-bold tracking-tight">{isEditing ? "Edit course" : "Add course"}</h1>
            {draft.courseId && (
              <span className="rounded-lg border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                Course ID: {draft.courseId}
              </span>
            )}
          </div>
          <div className="mt-6">
            <AddCourseStepper currentStep={currentStep} onStepChange={setStep} />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        {currentStep === 1 ? (
          <CourseDetailsStep
            courseId={draft.courseId}
            details={draft.details}
            errors={errors}
            savedPrelaunchStartDate={savedStepOneDetails.prelaunchStartDate}
            isEditing={isEditing}
            onDetailsLoaded={(details) => {
              setDraft((current) => ({ ...current, details }));
              setSavedStepOneDetails(details);
            }}
            onChange={(details) => {
              setDraft((current) => ({ ...current, details }));
              setErrors({});
            }}
            onDismissInfo={() => setShowInfo(false)}
            showInfo={showInfo}
          />
        ) : currentStep === 2 ? (
          <CourseVideosStep courseId={draft?.courseId} videos={draft.videos} onVideosChange={handleVideosChange} />
        ) : currentStep === 3 ? (
          <CourseLandingStep courseId={draft.courseId} ref={landingStepRef} />
        ) : (
          <CourseReviewStep
            videos={draft.videos}
            courseId={draft?.courseId}
            isPublishing={isPublishing}
            onPublish={() => handelPublishCourse(draft.courseId)}
          />
        )}
      </main>
      <footer className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-10">
        <Button className="h-11 text-slate-700 px-6" onClick={handleCancel} type="button" variant="outline">
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <Button
              className="h-11 px-6"
              onClick={() => setStep((currentStep - 1) as AddCourseStep)}
              type="button"
              variant="outline">
              Back
            </Button>
          )}
          {currentStep === 1 && (
            <Button className="h-11 px-6" onClick={handleSaveAndContinue} type="button">
              {hasStepOneChanges ? "Save & Continue" : "Continue"}
            </Button>
          )}
          {currentStep === 2 && (
            <Button className="h-11 px-6" onClick={() => setStep(3)} type="button">
              Continue
            </Button>
          )}
          {currentStep === 3 && (
            <Button
              className="h-11 gap-2 px-6"
              disabled={isSavingLandingPage}
              onClick={handleSaveLandingPage}
              type="button">
              {isSavingLandingPage && <LoaderCircle className="size-4 animate-spin" />}
              Save & continue to review
            </Button>
          )}
          {currentStep === 4 && (
            <>
              <Button
                className="h-11 gap-2 px-6"
                disabled={isPublishing}
                onClick={() => handelPublishCourse(draft.courseId)}
                type="button">
                {isPublishing && <LoaderCircle className="size-4 animate-spin" />}
                Publish course
              </Button>
            </>
          )}
        </div>
      </footer>
      <AlertDialog onOpenChange={setShowCancelDialog} open={showCancelDialog}>
        <AlertDialogContent
          className="relative gap-6 p-7"
          style={{
            left: "50%",
            maxHeight: "100%",
            maxWidth: "560px",
            overflowY: "auto",
            position: "fixed",
            top: "50%",
            width: "100%",
          }}>
          <AlertDialogHeader>
            <div className="flex items-center justify-between w-full">
              <span className="pr-10 text-xl font-semibold">
                {isEditing ? "Leave course editing?" : "Leave course creation?"}
              </span>
              <button
                aria-label="Close confirmation"
                className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
                onClick={() => setShowCancelDialog(false)}
                type="button">
                <X className="size-5" />
              </button>
            </div>
            <AlertDialogDescription className="text-base leading-6 pt-7">
              {isEditing
                ? "Your unsaved changes will be lost if you cancel and discard this edit."
                : "All the information you have entered will be lost if you cancel and discard this course. You can save it as a draft and continue later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex flex-row justify-end gap-3 m-0! px-0! pt-6! pb-0!">
            <AlertDialogAction
              className="h-12 px-5 w-1/2 min-w-0! max-w-1/2! flex-1 gap-2"
              disabled={isSavingDraft}
              onClick={saveAndLeave}>
              {isSavingDraft && <LoaderCircle className="size-4 animate-spin" />}
              Save As Draft
            </AlertDialogAction>
            <AlertDialogAction
              className="h-12 px-5 w-1/2 min-w-0! max-w-1/2! flex-1"
              onClick={stopProcess}
              variant="destructive">
              Discard and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default AddCoursePage;

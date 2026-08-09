import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { X } from "lucide-react";
import AddCourseStepper from "./add-course-stepper";
import { clearAddCourseDraft, readAddCourseDraft, saveAddCourseDraft, updateAddCourseStep } from "./add-course.storage";
import type { AddCourseDetails, AddCourseStep } from "./add-course.types";
import CourseDetailsStep from "./course-details-step";
import CourseVideosStep from "./course-videos-step";

const emptyDetails: AddCourseDetails = {
  title: "",
  description: "",
  price: "0",
  discountPercentage: "0",
  roundPayableAmount: false,
  thumbnailURL: "",
  thumbnailId: "",
};

function AddCoursePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => {
    const savedDraft = readAddCourseDraft();
    return savedDraft ? { ...savedDraft, videos: savedDraft.videos ?? [] } : { courseId: "", step: 1 as AddCourseStep, details: emptyDetails, videos: [] };
  });
  const [showInfo, setShowInfo] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [errors, setErrors] = useState<AddCourseDetailsErrors>({});

  useEffect(() => {
    saveAddCourseDraft(draft);
  }, [draft]);

  useEffect(() => {
    const confirmBeforeLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", confirmBeforeLeave);
    return () => window.removeEventListener("beforeunload", confirmBeforeLeave);
  }, []);

  const setStep = (step: AddCourseStep) => {
    setDraft((current) => ({ ...current, step }));
    updateAddCourseStep(step);
  };
  const saveAndLeave = () => {
    saveAddCourseDraft(draft);
    toast.add({
      title: SUCCESS_MESSAGES.COURSE_DRAFT_SAVED_TITLE,
      description: SUCCESS_MESSAGES.COURSE_DRAFT_SAVED_DESCRIPTION,
      type: "success",
    });
    navigate("/course");
  };
  const stopProcess = () => {
    clearAddCourseDraft();
    navigate("/course");
  };

  const handelSaveMoveToNextStep = useDebounce(async () => {
    try {
      const response = await multipleApiHandler([
        {
          endPoint: "/course/add/step-one",
          protected: true,
          data: draft.details,
          method: "POST",
        },
      ]);

      const res = response[0];

      if (!res?.data?.success || !res.data.data?.course_id) {
        toast.add({
          title: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_TITLE,
          description: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_DESCRIPTION,
          type: "error",
        });
        return;
      }

      toast.add({
        title: SUCCESS_MESSAGES.COURSE_DETAILS_SAVED_TITLE,
        description: SUCCESS_MESSAGES.COURSE_DETAILS_SAVED_DESCRIPTION,
        type: "success",
      });

      setDraft((pervData) => ({ ...pervData, courseId: res?.data?.data?.course_id }));
      setStep(2);
    } catch {
      toast.add({
        title: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_TITLE,
        description: ERROR_MESSAGES.COURSE_DRAFT_SAVE_FAILED_DESCRIPTION,
        type: "error",
      });
    }
  }, 100);
  const handleSaveAndContinue = () => {
    const validation = validateAddCourseDetails(draft.details);
    console.log(validation);
    setErrors(validation.errors);
    if (!validation.isValid) return;
    handelSaveMoveToNextStep();
  };

  return (
    <section className="flex min-h-[calc(100dvh-75px)] flex-col bg-white">
      <header className="border-b border-slate-200 px-4 py-5 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1580px]">
          <div className="flex items-center justify-between gap-4"><h1 className="text-xl font-bold tracking-tight">Add course</h1>{draft.courseId && <span className="rounded-lg border bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">Course ID: {draft.courseId}</span>}</div>
          <div className="mt-6">
            <AddCourseStepper currentStep={draft.step} onStepChange={setStep} />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-slate-50">
        {draft.step === 1 ? (
          <CourseDetailsStep
            details={draft.details}
            errors={errors}
            onChange={(details) => {
              setDraft((current) => ({ ...current, details }));
              setErrors({});
            }}
            onDismissInfo={() => setShowInfo(false)}
            showInfo={showInfo}
          />
        ) : draft.step === 2 ? (
          <CourseVideosStep videos={draft.videos} onVideosChange={(videos) => setDraft((current) => ({ ...current, videos }))} />
        ) : (
          <div className="mx-auto max-w-[1580px] px-6 py-12 text-center text-slate-500">
            This step is ready for the course video instructions.
          </div>
        )}
      </main>
      <footer className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-10">
        <Button
          className="h-11 text-slate-700 px-6"
          onClick={() => setShowCancelDialog(true)}
          type="button"
          variant="outline">
          Cancel
        </Button>
        <div className="flex items-center gap-3">
          {draft.step > 1 && (
            <Button
              className="h-11 px-6"
              onClick={() => setStep((draft.step - 1) as AddCourseStep)}
              type="button"
              variant="outline">
              Back
            </Button>
          )}
          {draft.step === 1 && (
            <Button className="h-11 px-6" onClick={handleSaveAndContinue} type="button">
              Save &amp; continue
            </Button>
          )}
          {draft.step === 2 && <Button className="h-11 px-6" onClick={() => setStep(3)} type="button">Continue to review</Button>}
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
              <span className="pr-10 text-xl font-semibold">Leave course creation?</span>
              <button
                aria-label="Close confirmation"
                className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
                onClick={() => setShowCancelDialog(false)}
                type="button">
                <X className="size-5" />
              </button>
            </div>
            <AlertDialogDescription className="text-base leading-6 pt-7">
              All the information you have entered will be lost if you cancel and discard this course. You can save it
              as a draft and continue later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="w-full flex flex-row justify-end gap-3 m-0! px-0! pt-6! pb-0!">
            <AlertDialogAction className="h-12 px-5 w-1/2 min-w-0! max-w-1/2! flex-1" onClick={saveAndLeave}>
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

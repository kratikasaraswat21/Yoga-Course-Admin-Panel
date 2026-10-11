import { Check } from "lucide-react";
import { Fragment } from "react";
import type { AddCourseStep } from "./add-course.types";

const steps = [
  { number: 1, label: "Course details" },
  { number: 2, label: "Course videos" },
  { number: 3, label: "Landing page" },
  { number: 4, label: "Review & publish" },
] as const;

function AddCourseStepper({
  currentStep,
  onStepChange,
}: {
  currentStep: AddCourseStep;
  onStepChange: (step: AddCourseStep) => void;
}) {
  return (
    <nav
      aria-label="Course creation progress"
      className="mx-auto grid w-full max-w-350 grid-cols-[auto_minmax(24px,1fr)_auto_minmax(24px,1fr)_auto_minmax(24px,1fr)_auto] items-center gap-3">
      {steps.map((step, index) => {
        const isCurrent = step.number === currentStep;
        const isComplete = step.number < currentStep;

        return (
          <Fragment key={step.number}>
            <button
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-3 text-left text-sm font-semibold transition ${
                isCurrent || isComplete ? "text-slate-900" : "text-slate-500"
              }`}
              disabled={!isComplete}
              onClick={() => isComplete && onStepChange(step.number)}
              type="button">
              <span
                className={`flex size-9 items-center justify-center rounded-full border text-sm ${
                  isCurrent
                    ? "border-slate-800 bg-slate-800 text-white"
                    : isComplete
                      ? "border-slate-800 bg-white text-slate-800"
                      : "border-slate-300 bg-white text-slate-500"
                }`}>
                {isComplete ? <Check className="size-4" /> : step.number}
              </span>
              <span className="hidden whitespace-nowrap sm:inline">
                <span className="block">{step.label}</span>
                {isComplete && <span className="mt-0.5 block text-xs font-normal text-slate-500">Completed</span>}
              </span>
            </button>
            {index < steps.length - 1 && <span className="h-px min-w-12 bg-slate-200" />}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default AddCourseStepper;

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

function CoursePageHeader({ onAddCourse }: { onAddCourse: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Course Management</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Create, organise, and manage the yoga courses available on the platform.
        </p>
      </div>
      <Button className="h-11 w-full shrink-0 gap-2 px-4 sm:w-auto" onClick={onAddCourse} type="button">
        <Plus aria-hidden="true" />
        Add course
      </Button>
    </div>
  );
}

export default CoursePageHeader;

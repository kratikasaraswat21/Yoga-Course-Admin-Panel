import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

function CoursePageHeader({ onAddCourse }: { onAddCourse: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">Content library</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Course Management</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Create, organise, and manage the yoga courses available on the platform.
        </p>
      </div>
      <Button className="h-11 shrink-0 gap-2 px-4" onClick={onAddCourse} type="button">
        <Plus aria-hidden="true" />
        Add course
      </Button>
    </div>
  );
}

export default CoursePageHeader;

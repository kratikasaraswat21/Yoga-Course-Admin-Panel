import { Badge } from "@/components/ui/badge";
import type { CourseStatus } from "@/utils/interface/course.interface";

const STATUS_STYLES: Record<CourseStatus, string> = {
  Published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Draft: "border-amber-200 bg-amber-50 text-amber-700",
  Archived: "border-slate-200 bg-slate-100 text-slate-600",
};

function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <Badge className={STATUS_STYLES[status]} variant="outline">
      {status}
    </Badge>
  );
}

export default CourseStatusBadge;

import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileVideo,
  LoaderCircle,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Star,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RichTextContent from "@/components/ui/rich-text-content";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { formatCoursePrice } from "@/utils/helper/course.helper";

type User = { id: string; name: string; email: string; status: string };
type Enrollment = { id: string; status: string; enrolledAt: string; expiresAt: string | null; user: User };
type Review = { id: string; rating: number; comment: string; createdAt: string; user: User };
type VideoRating = { id: string; rating: number; createdAt: string; user: User };
type AnalyticsVideo = {
  id: string;
  title: string;
  description?: string;
  fileType?: string;
  fileSize?: string | number;
  status?: string;
  readyToStream?: boolean;
  processingPercentage?: number;
  durationSeconds?: number;
  thumbnailUrl?: string;
  totalRatings?: number;
  averageRating?: number;
  ratings?: VideoRating[];
};
type CourseAnalytics = {
  course: {
    id: string;
    title: string;
    description?: string;
    status: string;
    price: number;
    discount: number;
    totalPayableAmount: number;
    thumbnailUrl?: string;
    createdAt: string;
  };
  analytics: {
    totalEnrollments: number;
    activeEnrollments: number;
    totalCourseReviews: number;
    averageCourseRating: number;
    totalVideoRatings: number;
  };
  enrolledUsers: Enrollment[];
  courseReviews: Review[];
  videos: AnalyticsVideo[];
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
};

const formatDuration = (seconds = 0) => {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  return `${Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0")}`;
};

const formatFileSize = (value?: string | number) => {
  const bytes = Number(value) || 0;
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const statusClassName = (status: string) => {
  const normalized = status.toUpperCase();
  if (["PUBLISHED", "ACTIVE", "READY"].includes(normalized)) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (["REVOKED", "FAILED"].includes(normalized)) return "border-red-200 bg-red-50 text-red-700";
  if (["REFUNDED", "PROCESSING"].includes(normalized)) return "border-orange-200 bg-orange-50 text-orange-700";
  if (["DRAFT", "UPLOADING"].includes(normalized)) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
};

function StatusBadge({ status }: { status?: string }) {
  const value = status || "UNKNOWN";
  return (
    <Badge className={statusClassName(value)} variant="outline">
      {value}
    </Badge>
  );
}

function StarRating({ rating = 0, showValue = true }: { rating?: number; showValue?: boolean }) {
  const normalized = Math.max(0, Math.min(5, Number(rating) || 0));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${normalized.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => {
        const filled = normalized >= index + 1;
        const half = !filled && normalized >= index + 0.5;
        return (
          <span className="relative inline-flex size-4" key={index}>
            <Star className="absolute size-4 text-slate-300" />
            {(filled || half) && (
              <Star
                className="absolute size-4 text-amber-400"
                style={half ? { clipPath: "inset(0 50% 0 0)" } : undefined}
              />
            )}
          </span>
        );
      })}
      {showValue && <span className="ml-1 text-sm font-medium text-slate-700">{normalized.toFixed(1)}</span>}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  rating,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  rating?: boolean;
}) {
  return (
    <Card className="gap-3 py-4">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            {rating ? (
              <div className="mt-2">
                <StarRating rating={Number(value)} />
              </div>
            ) : (
              <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">{description}</p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="size-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-32 rounded-xl" key={index} />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="px-6 py-10 text-center text-sm text-slate-500">{message}</div>;
}

function CourseAnalyticsPage() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [data, setData] = useState<CourseAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [userSearch, setUserSearch] = useState("");
  const [enrollmentFilter, setEnrollmentFilter] = useState("ALL");
  const [userPage, setUserPage] = useState(1);
  const [expandedVideos, setExpandedVideos] = useState<Record<string, boolean>>({});
  const [enrollmentToRevoke, setEnrollmentToRevoke] = useState<Enrollment | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeError, setRevokeError] = useState("");
  const [isRevoking, setIsRevoking] = useState(false);
  const revocationInProgressRef = useRef(false);
  const [enrollmentToRestore, setEnrollmentToRestore] = useState<Enrollment | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const restorationInProgressRef = useRef(false);

  const fetchAnalytics = useDebounce(async () => {
    if (!courseId) {
      setError("A valid course ID is required to view analytics.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    const response = await multipleApiHandler([
      { endPoint: `/course/analytics/${encodeURIComponent(courseId)}`, method: "GET", protected: true },
    ]);
    const result = response[0];
    if (result?.status === 401 || result?.status === 403) {
      navigate("/auth/login", { replace: true });
      return;
    }
    if (!result?.data?.success || !result.data.data?.course || !result.data.data?.analytics) {
      setError(result?.data?.message || "Unable to load course analytics.");
      setData(null);
    } else {
      setData({
        course: result.data.data.course,
        analytics: result.data.data.analytics,
        enrolledUsers: Array.isArray(result.data.data.enrolledUsers) ? result.data.data.enrolledUsers : [],
        courseReviews: Array.isArray(result.data.data.courseReviews) ? result.data.data.courseReviews : [],
        videos: Array.isArray(result.data.data.videos) ? result.data.data.videos : [],
      });
    }
    setIsLoading(false);
  }, 100);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, retryKey]);

  const revokeAccess = useDebounce(async (enrollment: Enrollment, reason: string) => {
    if (!courseId) return;

    try {
      const response = await multipleApiHandler([
        {
          endPoint: `/course/${encodeURIComponent(courseId)}/users/${encodeURIComponent(enrollment.user.id)}/revoke-access`,
          method: "POST",
          protected: true,
          data: { reason },
        },
      ]);
      const result = response[0];

      if (result?.status === 401 || result?.status === 403) {
        navigate("/auth/login", { replace: true });
        return;
      }

      if (!result?.data?.success) {
        const message = result?.data?.message || "Unable to revoke course access.";
        setRevokeError(message);
        toast.add({ title: "Unable to revoke access", description: message, type: "error" });
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              enrolledUsers: current.enrolledUsers.map((item) =>
                item.id === enrollment.id ? { ...item, status: "REVOKED" } : item,
              ),
            }
          : current,
      );
      setEnrollmentToRevoke(null);
      setRevokeReason("");
      setRevokeError("");
      toast.add({
        title: "Course access revoked successfully",
        description: result.data.message || `${enrollment.user.name}'s access to this course was revoked.`,
        type: "success",
      });
      fetchAnalytics();
    } catch {
      const message = "Unable to revoke course access. Please check your connection and try again.";
      setRevokeError(message);
      toast.add({ title: "Unable to revoke access", description: message, type: "error" });
    } finally {
      revocationInProgressRef.current = false;
      setIsRevoking(false);
    }
  }, 100);

  const openRevokeDialog = (enrollment: Enrollment) => {
    setEnrollmentToRevoke(enrollment);
    setRevokeReason("");
    setRevokeError("");
  };

  const closeRevokeDialog = () => {
    if (isRevoking) return;
    setEnrollmentToRevoke(null);
    setRevokeReason("");
    setRevokeError("");
  };

  const submitRevoke = () => {
    const reason = revokeReason.trim();
    if (!enrollmentToRevoke || isRevoking || revocationInProgressRef.current) return;
    if (reason.length < 5 || reason.length > 1000) {
      setRevokeError("Reason must be between 5 and 1000 characters.");
      return;
    }

    revocationInProgressRef.current = true;
    setIsRevoking(true);
    setRevokeError("");
    revokeAccess(enrollmentToRevoke, reason);
  };

  const restoreAccess = useDebounce(async (enrollment: Enrollment) => {
    if (!courseId) return;

    try {
      const response = await multipleApiHandler([
        {
          endPoint:
            "/course/" +
            encodeURIComponent(courseId) +
            "/users/" +
            encodeURIComponent(enrollment.user.id) +
            "/restore-access",
          method: "POST",
          protected: true,
        },
      ]);
      const result = response[0];

      if (result?.status === 401 || result?.status === 403) {
        navigate("/auth/login", { replace: true });
        return;
      }

      if (!result?.data?.success) {
        const message = result?.data?.message || "Unable to restore course access.";
        setRestoreError(message);
        toast.add({ title: "Unable to restore access", description: message, type: "error" });
        return;
      }

      setData((current) =>
        current
          ? {
              ...current,
              enrolledUsers: current.enrolledUsers.map((item) =>
                item.id === enrollment.id ? { ...item, status: "ACTIVE" } : item,
              ),
            }
          : current,
      );
      setEnrollmentToRestore(null);
      setRestoreError("");
      toast.add({
        title: "Course access restored successfully",
        description: result.data.message || enrollment.user.name + "'s access to this course is active again.",
        type: "success",
      });
      fetchAnalytics();
    } catch {
      const message = "Unable to restore course access. Please check your connection and try again.";
      setRestoreError(message);
      toast.add({ title: "Unable to restore access", description: message, type: "error" });
    } finally {
      restorationInProgressRef.current = false;
      setIsRestoring(false);
    }
  }, 100);

  const openRestoreDialog = (enrollment: Enrollment) => {
    setEnrollmentToRestore(enrollment);
    setRestoreError("");
  };

  const closeRestoreDialog = () => {
    if (isRestoring) return;
    setEnrollmentToRestore(null);
    setRestoreError("");
  };

  const submitRestore = () => {
    if (!enrollmentToRestore || isRestoring || restorationInProgressRef.current) return;

    restorationInProgressRef.current = true;
    setIsRestoring(true);
    setRestoreError("");
    restoreAccess(enrollmentToRestore);
  };

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return (data?.enrolledUsers ?? []).filter((enrollment) => {
      const matchesSearch =
        !query || `${enrollment.user?.name ?? ""} ${enrollment.user?.email ?? ""}`.toLowerCase().includes(query);
      return matchesSearch && (enrollmentFilter === "ALL" || enrollment.status === enrollmentFilter);
    });
  }, [data?.enrolledUsers, enrollmentFilter, userSearch]);
  const usersPerPage = 10;
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage));
  const visibleUsers = filteredUsers.slice((userPage - 1) * usersPerPage, userPage * usersPerPage);

  if (isLoading)
    return (
      <section className="min-h-full p-4 sm:p-6 lg:p-8">
        <LoadingState />
      </section>
    );
  if (error || !data)
    return (
      <section className="flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <Card className="w-full max-w-lg">
          <CardContent className="space-y-4 p-8 text-center">
            <BarChart3 className="mx-auto size-10 text-slate-400" />
            <h2 className="text-xl font-semibold">Analytics unavailable</h2>
            <p className="text-sm text-slate-500">{error || "No analytics data was returned for this course."}</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => navigate("/course")} variant="outline">
                Back to courses
              </Button>
              <Button onClick={() => setRetryKey((value) => value + 1)}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );

  const { course, analytics } = data;
  return (
    <section className="min-h-full space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <Button className="gap-2" onClick={() => navigate("/course")} size="sm" variant="outline">
          <ArrowLeft className="size-4" /> Back to courses
        </Button>
        <span>Admin</span>
        <span>/</span>
        <span>Courses</span>
        <span>/</span>
        <span className="text-slate-900">Course Analytics</span>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-5 p-5 md:flex-row md:items-center">
          <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
            {course.thumbnailUrl ? (
              <img alt={`${course.title} thumbnail`} className="size-full object-cover" src={course.thumbnailUrl} />
            ) : (
              <PlayCircle className="size-10 text-slate-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{course.title}</h1>
              <StatusBadge status={course.status} />
            </div>
            <RichTextContent
              className="mt-2 max-w-3xl text-sm leading-6 text-slate-500"
              fallback="No course description available."
              html={course.description}
            />
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span>
                Price: <strong>{formatCoursePrice(course.price)}</strong>
              </span>
              <span>
                Discount: <strong>{course.discount ?? 0}%</strong>
              </span>
              <span>
                Payable: <strong>{formatCoursePrice(course.totalPayableAmount)}</strong>
              </span>
              <span>
                Created: <strong>{formatDate(course.createdAt)}</strong>
              </span>
              <span>
                Videos: <strong>{data.videos.length}</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          description="All enrollments"
          icon={Users}
          title="Total Enrollments"
          value={String(analytics.totalEnrollments ?? 0)}
        />
        <SummaryCard
          description="Currently active"
          icon={Users}
          title="Active Enrollments"
          value={String(analytics.activeEnrollments ?? 0)}
        />
        <SummaryCard
          description="Course reviews"
          icon={Star}
          title="Course Reviews"
          value={String(analytics.totalCourseReviews ?? 0)}
        />
        <SummaryCard
          description={`Based on ${analytics.totalCourseReviews ?? 0} reviews`}
          icon={Star}
          rating
          title="Average Course Rating"
          value={Number(analytics.averageCourseRating ?? 0).toFixed(1)}
        />
        <SummaryCard
          description="Across all videos"
          icon={Video}
          title="Total Video Ratings"
          value={String(analytics.totalVideoRatings ?? 0)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled users</CardTitle>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Input
              className="max-w-sm"
              onChange={(event) => {
                setUserSearch(event.target.value);
                setUserPage(1);
              }}
              placeholder="Search name or email"
              value={userSearch}
            />
            <Select
              onValueChange={(value) => {
                setEnrollmentFilter(value ?? "ALL");
                setUserPage(1);
              }}
              value={enrollmentFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="REVOKED">Revoked</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        {visibleUsers.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>User status</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleUsers.map((enrollment) => (
                  <TableRow key={enrollment.id}>
                    <TableCell>
                      <p className="font-medium">{enrollment.user?.name || "Unknown user"}</p>
                      <p className="text-xs text-slate-500">{enrollment.user?.email || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.user?.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={enrollment.status} />
                    </TableCell>
                    <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                    <TableCell>{enrollment.expiresAt ? formatDate(enrollment.expiresAt) : "No expiry"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        disabled={isRevoking || isRestoring}
                        onClick={() =>
                          enrollment.status.toUpperCase() === "REVOKED"
                            ? openRestoreDialog(enrollment)
                            : openRevokeDialog(enrollment)
                        }
                        size="sm"
                        type="button"
                        variant={enrollment.status.toUpperCase() === "REVOKED" ? "outline" : "destructive"}>
                        {enrollment.status.toUpperCase() === "REVOKED" ? "Restore Access" : "Revoke Access"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t px-5 py-3 text-sm text-slate-500">
              <span>{filteredUsers.length} users</span>
              <div className="flex items-center gap-2">
                <Button
                  disabled={userPage === 1}
                  onClick={() => setUserPage((page) => page - 1)}
                  size="sm"
                  variant="outline">
                  Previous
                </Button>
                <span>
                  Page {userPage} of {totalUserPages}
                </span>
                <Button
                  disabled={userPage === totalUserPages}
                  onClick={() => setUserPage((page) => page + 1)}
                  size="sm"
                  variant="outline">
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <EmptyState message="No enrolled users found." />
        )}
      </Card>

      <Dialog open={Boolean(enrollmentToRevoke)} onOpenChange={(open) => !open && closeRevokeDialog()}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b bg-slate-50/80 p-6 pb-5 pr-12">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <ShieldAlert className="size-5" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Revoke course access?</DialogTitle>
            <DialogDescription className="mt-1.5 leading-5">
              Access for{" "}
              <strong className="font-semibold text-slate-700">{enrollmentToRevoke?.user.name || "this user"}</strong>{" "}
              will be removed from <strong className="font-semibold text-slate-700">{course.title}</strong>.
              <span className="mt-2 block text-xs font-medium text-slate-500">
                This does not affect their account or access to other courses.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-6">
            <label
              className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-800"
              htmlFor="revoke-reason">
              <span>
                Reason for revoking access <span className="text-red-500">*</span>
              </span>
              <span className="text-xs font-normal text-slate-400">Required</span>
            </label>
            <Textarea
              aria-describedby={revokeError ? "revoke-reason-error" : undefined}
              aria-invalid={Boolean(revokeError)}
              className="min-h-32 resize-none border-slate-200 bg-white shadow-sm placeholder:text-slate-400 focus-visible:border-slate-400 focus-visible:ring-slate-200"
              disabled={isRevoking}
              id="revoke-reason"
              maxLength={1000}
              onChange={(event) => {
                setRevokeReason(event.target.value);
                if (revokeError) setRevokeError("");
              }}
              placeholder="Enter the reason for this course-specific revocation"
              rows={5}
              value={revokeReason}
            />
            <div className="flex min-h-5 items-start justify-between gap-3 text-xs">
              <span id="revoke-reason-error" className={revokeError ? "font-medium text-red-600" : "text-slate-500"}>
                {revokeError || "Enter between 5 and 1000 characters."}
              </span>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-500">
                {revokeReason.length}/1000
              </span>
            </div>
          </div>
          <DialogFooter className="m-0 rounded-none border-t bg-slate-50/80 px-6 py-4 sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={isRevoking}
              onClick={closeRevokeDialog}
              type="button"
              variant="outline">
              Cancel
            </Button>
            <Button
              className="w-full bg-red-600 text-white hover:bg-red-700 sm:w-auto"
              disabled={isRevoking || revokeReason.trim().length < 5}
              onClick={submitRevoke}
              type="button">
              {isRevoking && <LoaderCircle className="size-4 animate-spin" />}
              {isRevoking ? "Revoking…" : "Revoke Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(enrollmentToRestore)} onOpenChange={(open) => !open && closeRestoreDialog()}>
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b bg-emerald-50/70 p-6 pb-5 pr-12">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="size-5" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Restore course access?</DialogTitle>
            <DialogDescription className="mt-1.5 leading-5">
              Restore access for{" "}
              <strong className="font-semibold text-slate-700">{enrollmentToRestore?.user.name || "this user"}</strong>{" "}
              to <strong className="font-semibold text-slate-700">{course.title}</strong>.
              <span className="mt-2 block text-xs font-medium text-slate-500">
                Only this course will be restored. Their account and other courses will remain unchanged.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="m-0 rounded-none border-t bg-slate-50/80 px-6 py-4 sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              disabled={isRestoring}
              onClick={closeRestoreDialog}
              type="button"
              variant="outline">
              Cancel
            </Button>
            <Button
              className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
              disabled={isRestoring}
              onClick={submitRestore}
              type="button">
              {isRestoring && <LoaderCircle className="size-4 animate-spin" />}
              {isRestoring ? "Restoring…" : "Restore Access"}
            </Button>
          </DialogFooter>
          {restoreError && <p className="px-6 pb-5 text-xs font-medium text-red-600">{restoreError}</p>}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Course reviews</CardTitle>
        </CardHeader>
        {data.courseReviews.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.courseReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <p className="font-medium">{review.user?.name || "Unknown user"}</p>
                    <p className="text-xs text-slate-500">{review.user?.email || "—"}</p>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={review.user?.status} />
                  </TableCell>
                  <TableCell>
                    <StarRating rating={review.rating} />
                  </TableCell>
                  <TableCell className="max-w-md whitespace-normal text-slate-600">
                    {review.comment || "No comment"}
                  </TableCell>
                  <TableCell>{formatDate(review.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState message="No reviews yet." />
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.videos.length ? (
            data.videos.map((video) => {
              const ratings = video.ratings ?? [];
              const expanded = Boolean(expandedVideos[video.id]);
              return (
                <Card className="gap-0 py-0" key={video.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                      <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                        {video.thumbnailUrl ? (
                          <img
                            alt={`${video.title} thumbnail`}
                            className="size-full object-cover"
                            src={video.thumbnailUrl}
                          />
                        ) : (
                          <FileVideo className="size-8 text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{video.title}</h3>
                          <StatusBadge status={video.status} />
                        </div>
                        <RichTextContent
                          className="mt-1 line-clamp-2 text-sm text-slate-500"
                          fallback="No description available."
                          html={video.description}
                        />
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="size-3.5" />
                            {formatDuration(video.durationSeconds)}
                          </span>
                          <span>{formatFileSize(video.fileSize)}</span>
                          <span>
                            <StarRating rating={video.averageRating ?? 0} /> ({video.totalRatings ?? ratings.length})
                          </span>
                          <span>
                            {video.readyToStream ? "Ready to stream" : `${video.processingPercentage ?? 0}% processed`}
                          </span>
                        </div>
                      </div>
                      <Button
                        className="gap-2 self-start"
                        onClick={() => setExpandedVideos((current) => ({ ...current, [video.id]: !expanded }))}
                        type="button"
                        variant="outline">
                        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />} Ratings
                      </Button>
                    </div>
                    {expanded && (
                      <div className="mt-4 border-t pt-4">
                        {ratings.length ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Reviewer</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>Date</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ratings.map((rating) => (
                                <TableRow key={rating.id}>
                                  <TableCell>
                                    <p className="font-medium">{rating.user?.name || "Unknown user"}</p>
                                    <p className="text-xs text-slate-500">{rating.user?.email || "—"}</p>
                                  </TableCell>
                                  <TableCell>
                                    <StatusBadge status={rating.user?.status} />
                                  </TableCell>
                                  <TableCell>
                                    <StarRating rating={rating.rating} />
                                  </TableCell>
                                  <TableCell>{formatDate(rating.createdAt)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="py-4 text-center text-sm text-slate-500">No ratings yet.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <EmptyState message="No videos found for this course." />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

export default CourseAnalyticsPage;

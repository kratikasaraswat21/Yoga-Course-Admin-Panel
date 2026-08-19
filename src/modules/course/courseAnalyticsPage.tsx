import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileVideo,
  PlayCircle,
  Star,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {course.description || "No course description available."}
            </p>
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
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {video.description || "No description available."}
                        </p>
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

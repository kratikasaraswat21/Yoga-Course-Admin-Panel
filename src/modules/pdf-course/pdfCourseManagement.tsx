import { ExternalLink, FileText, GripVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import UploadPdfCourseSidebar from "@/modules/pdf-course/uploadPdfCourseSidebar";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { reorderPdfCourses } from "@/utils/api/pdf-course.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { statusClassName } from "@/utils/constants/global.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import { formatCoursePrice } from "@/utils/helper/course.helper";
import { formatPdfDate } from "@/utils/helper/pdf-course.helper";
import type {
  PdfCourse,
  PdfCourseFormData,
  PdfCourseFormErrors,
  PendingUpload,
} from "@/utils/interface/pdf-course.interface";

function ActionTooltip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const EMPTY_FORM: PdfCourseFormData = {
  title: "",
  description: "",
  pdfFileName: "",
  fileUrl: "",
  thumbnailUrl: "",
  price: 0,
  discount: 0,
  totalPayableAmount: 0,
  isAvailableForFree: false,
  status: "DRAFT",
};

function PdfCourseManagementPage() {
  const [pdfCourses, setPdfCourses] = useState<PdfCourse[]>([]);
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<PdfCourseFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<PdfCourseFormErrors>({});
  const [isPdfDragging, setIsPdfDragging] = useState(false);
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [pendingUpload, setPendingUpload] = useState<PendingUpload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editCourseId, setEditCourseId] = useState<string | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<PdfCourse | null>(null);
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [dragOverCourseId, setDragOverCourseId] = useState<string | null>(null);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pdfCourses.filter((pdf) => !query || `${pdf.title} ${pdf.description}`.toLowerCase().includes(query));
  }, [pdfCourses, search]);

  const openDrawer = () => {
    setEditCourseId(null);
    setFormData({ ...EMPTY_FORM });
    setErrors({});
    setThumbnailPreview("");
    setPendingUpload(null);
    setIsPdfDragging(false);
    setIsThumbnailDragging(false);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (pdf: PdfCourse) => {
    setEditCourseId(pdf?.id);
    setFormData({
      title: pdf.title,
      description: pdf.description,
      pdfFileName: pdf.pdfFileName,
      fileUrl: pdf.fileUrl,
      thumbnailUrl: pdf.thumbnailUrl,
      price: Number(pdf.price ?? 0),
      discount: Number(pdf.discount ?? 0),
      totalPayableAmount: Number(pdf.totalPayableAmount ?? 0),
      isAvailableForFree: Boolean(pdf.isAvailableForFree),
      status: pdf.status,
    });
    setErrors({});
    setThumbnailPreview(pdf.thumbnailUrl ?? "");
    setPendingUpload(null);
    setIsPdfDragging(false);
    setIsThumbnailDragging(false);
    setIsDrawerOpen(true);
  };

  const deletePdf = (pdf: PdfCourse) => {
    setCourseToDelete(pdf);
  };

  const confirmDeletePdf = () => {
    if (!courseToDelete) return;
    handelDeletePdfCourse(courseToDelete);
    setCourseToDelete(null);
  };

  const fetchPdfCourses = useDebounce(async () => {
    const response = await multipleApiHandler([
      {
        endPoint: "/pdf-course/fetch",
        protected: true,
      },
    ]);
    const result = response[0];
    const courses =
      result?.data?.success && Array.isArray(result.data.data?.pdf_courses) ? result.data.data.pdf_courses : [];

    setPdfCourses(courses);
    if (result?.data?.success) {
      setIsLoading(false);
    }
  }, 200);

  const handelDeletePdfCourse = useDebounce(async (pdf: PdfCourse) => {
    const response = await multipleApiHandler([
      {
        endPoint: `/pdf-course/delete?id=${pdf?.id}`,
        protected: true,
        method: "DELETE",
      },
    ]);
    const result = response[0];
    if (result?.data?.success) {
      setIsLoading(true);
      fetchPdfCourses();
    }

    toast.add({
      title:
        result?.data?.message ??
        (result?.data?.success ? SUCCESS_MESSAGES.PDF_COURSE_DELETED : ERROR_MESSAGES.PDF_COURSE_DELETE_FAILED),
      type: result?.data?.success ? "success" : "error",
    });
  }, 100);

  const reFetchThePdfCourseData = () => {
    setIsLoading(true);
    fetchPdfCourses();
  };

  const handleCourseDrop = async (targetCourseId: string) => {
    if (!draggedCourseId || draggedCourseId === targetCourseId) {
      setDraggedCourseId(null);
      setDragOverCourseId(null);
      return;
    }

    const sourceIndex = pdfCourses.findIndex((course) => course.id === draggedCourseId);
    const targetIndex = pdfCourses.findIndex((course) => course.id === targetCourseId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reorderedCourses = [...pdfCourses];
    const [movedCourse] = reorderedCourses.splice(sourceIndex, 1);
    reorderedCourses.splice(targetIndex, 0, movedCourse);
    setPdfCourses(reorderedCourses);
    setDraggedCourseId(null);
    setDragOverCourseId(null);

    const result = await reorderPdfCourses({
      courseId: draggedCourseId,
      sortOrder: targetIndex,
      orderedIds: reorderedCourses.map((course) => course.id),
    });
    toast.add({
      title: result?.data?.message ?? (result?.data?.success ? SUCCESS_MESSAGES.ORDER_UPDATED : ERROR_MESSAGES.ORDER_UPDATE_FAILED),
      type: result?.data?.success ? "success" : "error",
    });
    if (!result?.data?.success) reFetchThePdfCourseData();
  };

  useEffect(() => {
    const fetchData = () => {
      setIsLoading(true);
      fetchPdfCourses();
    };
    fetchData();
  }, []);

  return (
    <section className="min-h-full w-full flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">PDF Course Manager</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload and manage PDF courses for your students.
          </p>
        </div>
      </div>
      <div className="flex flex-col h-full flex-1 ring-1 ring-foreground/10 mt-8 rounded-xl overflow-clip relative">
        <div className="p-4 sticky top-0 w-full bg-white z-10 flex items-center justify-between  rounded-none ring-1 ring-foreground/10">
          <div className="relative w-full max-w-130">
            <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 bg-white pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search PDF courses..."
              type="search"
              value={search}
            />
          </div>
          <Button className="h-11 shrink-0 gap-2 px-4" onClick={openDrawer} type="button">
            <Plus aria-hidden="true" /> Add PDF course
          </Button>
        </div>

        <Card className="gap-0 py-0 h-full relative rounded-none flex-1 ring-0">
          {isLoading ? (
            <div className="grid gap-5 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <Card className="gap-0 py-0" key={index}>
                  <Skeleton className="h-55 w-full rounded-none bg-slate-300" />
                  <CardContent className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4 bg-slate-300" />
                    <Skeleton className="h-10 w-full bg-slate-300" />
                    <Skeleton className="h-4 w-1/2 bg-slate-300" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length ? (
            <div className="grid gap-5 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((pdf) => (
                <Card
                  className={`group gap-0 cursor-grab py-0 transition-shadow hover:shadow-md active:cursor-grabbing ${dragOverCourseId === pdf.id ? "ring-2 ring-slate-900" : ""} ${draggedCourseId === pdf.id ? "opacity-50" : ""}`}
                  draggable
                  key={pdf.id}
                  onDragEnd={() => {
                    setDraggedCourseId(null);
                    setDragOverCourseId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggedCourseId !== pdf.id) setDragOverCourseId(pdf.id);
                  }}
                  onDragStart={() => setDraggedCourseId(pdf.id)}
                  onDrop={(event) => {
                    event.preventDefault();
                    void handleCourseDrop(pdf.id);
                  }}>
                  {pdf.thumbnailUrl ? (
                    <img alt={`${pdf.title} thumbnail`} className="h-55 w-full object-cover" src={pdf.thumbnailUrl} />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-gradient-to-br from-rose-50 via-orange-50 to-slate-100 text-rose-500">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-rose-100">
                        <FileText className="size-8" />
                      </div>
                    </div>
                  )}
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <GripVertical aria-label="Drag to reorder" className="size-4 shrink-0 text-slate-400" />
                          <h3 className="truncate font-semibold">{pdf.title}</h3>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ${statusClassName[pdf.status]}`}>
                            {pdf.status}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{pdf.description}</p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <ActionTooltip label="Edit course">
                          <Button
                            aria-label={`Edit ${pdf.title}`}
                            className="shrink-0 text-black hover:text-slate-700 rounded-sm border border-slate-300"
                            onClick={() => openEditDrawer(pdf)}
                            size="icon"
                            type="button"
                            variant="outline">
                            <Pencil className="size-4" />
                          </Button>
                        </ActionTooltip>
                        <ActionTooltip label="Delete course">
                          <Button
                            aria-label={`Delete ${pdf.title}`}
                            className="shrink-0 text-black hover:text-red-500 rounded-sm border border-slate-300 hover:border-red-500"
                            onClick={() => deletePdf(pdf)}
                            size="icon"
                            type="button"
                            variant="outline">
                            <Trash2 className="size-4" />
                          </Button>
                        </ActionTooltip>
                      </div>
                    </div>
                    <div className="space-y-2 border-t pt-3 text-sm">
                      {pdf.isAvailableForFree ? (
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-500">Access</span>
                          <span className="font-semibold text-emerald-600">Free</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-500">Price</span>
                            <span className="font-medium text-slate-700">{formatCoursePrice(Number(pdf.price ?? 0))}</span>
                          </div>
                          {Number(pdf.discount ?? 0) > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-500">Discount</span>
                              <span className="font-medium text-emerald-600">{Number(pdf.discount)}% off</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between border-t border-dashed pt-2">
                            <span className="font-semibold text-slate-700">Total payable</span>
                            <span className="font-bold text-slate-900">
                              {formatCoursePrice(Number(pdf.totalPayableAmount ?? 0))}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t pt-3 text-xs text-slate-500">
                      <span className="flex min-w-0 items-center gap-1.5 truncate" title={pdf.pdfFileName}>
                        <FileText className="size-3.5 shrink-0 text-rose-500" />
                        {pdf.pdfFileName}
                      </span>
                      <span className="shrink-0">{formatPdfDate(pdf.updatedAt)}</span>
                    </div>
                    <ActionTooltip label={pdf.fileUrl ? "Open uploaded PDF" : "PDF URL unavailable"}>
                      <Button
                        className="h-10 w-full gap-2"
                        disabled={!pdf.fileUrl}
                        onClick={() => pdf.fileUrl && window.open(pdf.fileUrl, "_blank", "noopener,noreferrer")}
                        type="button"
                        variant="outline">
                        <ExternalLink className="size-4" /> Open PDF
                      </Button>
                    </ActionTooltip>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 ring-1 ring-rose-100">
                <FileText className="size-8" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                {search.trim() ? "No matching PDF courses" : "No PDF courses yet"}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {search.trim()
                  ? "Try a different search term or clear your search to view all PDF courses."
                  : "Build your content library by adding your first PDF course for students."}
              </p>
              <Button
                className="mt-6 h-11 gap-2"
                onClick={() => (search.trim() ? setSearch("") : openDrawer())}
                type="button">
                {search.trim() ? (
                  "Clear search"
                ) : (
                  <>
                    <Plus className="size-4" /> Add PDF course
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <UploadPdfCourseSidebar
        errors={errors}
        formData={formData}
        isDrawerOpen={isDrawerOpen}
        isPdfDragging={isPdfDragging}
        isThumbnailDragging={isThumbnailDragging}
        isEditing={Boolean(editCourseId)}
        editCourseId={editCourseId ?? ""}
        pendingUpload={pendingUpload}
        setErrors={setErrors}
        setFormData={setFormData}
        setIsDrawerOpen={setIsDrawerOpen}
        setIsPdfDragging={setIsPdfDragging}
        setIsThumbnailDragging={setIsThumbnailDragging}
        setPendingUpload={setPendingUpload}
        setThumbnailPreview={setThumbnailPreview}
        thumbnailPreview={thumbnailPreview}
        reFetchThePdfCourseData={reFetchThePdfCourseData}
      />

      <AlertDialog open={Boolean(courseToDelete)} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent className="max-w-md gap-6 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PDF course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove “{courseToDelete?.title}” from the PDF course library. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 p-6">
            <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction className="h-11" onClick={confirmDeletePdf} variant="destructive">
              Delete course
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

export default PdfCourseManagementPage;

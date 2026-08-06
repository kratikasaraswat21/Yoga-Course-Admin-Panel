import { ExternalLink, GripVertical, ImageIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import UploadAffiliateProductSidebar from "@/modules/affiliate-product/uploadAffiliateProductSidebar";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import { ERROR_MESSAGES } from "@/utils/constants/error.constants";
import { SUCCESS_MESSAGES } from "@/utils/constants/success.constants";
import type {
  AffiliateProduct,
  AffiliateProductFormData,
  AffiliateProductFormErrors,
  PendingAffiliateThumbnail,
} from "@/utils/interface/affiliate-product.interface";

function ActionTooltip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const EMPTY_FORM: AffiliateProductFormData = {
  title: "",
  description: "",
  affiliateLink: "",
  thumbnailUrl: "",
  status: "DRAFT",
  buttonTitle: "",
  sortOrder: 0,
};

function AffiliateProductManagementPage() {
  // This remains empty until the affiliate product API is connected.
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [search, setSearch] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formData, setFormData] = useState<AffiliateProductFormData>({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<AffiliateProductFormErrors>({});
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [pendingThumbnail, setPendingThumbnail] = useState<PendingAffiliateThumbnail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter(
      (product) => !query || `${product.title} ${product.description}`.toLowerCase().includes(query),
    );
  }, [products, search]);

  const fetchAffiliateProducts = useDebounce(async () => {
    const response = await multipleApiHandler([
      {
        endPoint: "affiliate-product/fetch",
        protected: true,
        method: "GET",
      },
    ]);

    const result = response[0];
    const courses = result?.data?.success && Array.isArray(result.data.data?.products) ? result.data.data.products : [];

    setProducts(courses);
    setLoadingProducts(false);
  }, 100);

  const reFetchAffiliateProducts = () => {
    setLoadingProducts(true);
    fetchAffiliateProducts();
  };

  const openDrawer = () => {
    setIsEditing(false);
    setEditingProductId(null);
    setFormData({ ...EMPTY_FORM });
    setErrors({});
    setThumbnailPreview("");
    setPendingThumbnail(null);
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product: AffiliateProduct) => {
    setIsEditing(true);
    setEditingProductId(product.id);
    setFormData({
      title: product.title,
      description: product.description,
      affiliateLink: product.affiliateLink,
      thumbnailUrl: product.thumbnailUrl,
      status: product.status,
      buttonTitle: product.buttonTitle,
      sortOrder: product.sortOrder,
    });
    setErrors({});
    setThumbnailPreview(product.thumbnailUrl ?? "");
    setPendingThumbnail(null);
    setIsDrawerOpen(true);
  };

  const handleProductDrop = async (targetProductId: string) => {
    if (!draggedProductId || draggedProductId === targetProductId) {
      setDraggedProductId(null);
      setDragOverProductId(null);
      return;
    }

    const sourceIndex = products.findIndex((product) => product.id === draggedProductId);
    const targetIndex = products.findIndex((product) => product.id === targetProductId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reorderedProducts = [...products];
    const [movedProduct] = reorderedProducts.splice(sourceIndex, 1);
    reorderedProducts.splice(targetIndex, 0, movedProduct);
    setProducts(reorderedProducts);
    setDraggedProductId(null);
    setDragOverProductId(null);

    const response = await multipleApiHandler([
      {
        endPoint: "affiliate-product/reorder",
        method: "PUT",
        protected: true,
        data: {
          productId: draggedProductId,
          sortOrder: targetIndex,
          orderedIds: reorderedProducts.map((product) => product.id),
        },
      },
    ]);
    const result = response[0];
    toast.add({
      title: result?.data?.message ?? (result?.data?.success ? SUCCESS_MESSAGES.ORDER_UPDATED : ERROR_MESSAGES.ORDER_UPDATE_FAILED),
      type: result?.data?.success ? "success" : "error",
    });
    if (!result?.data?.success) reFetchAffiliateProducts();
  };

  useEffect(() => {
    fetchAffiliateProducts();
  }, []);

  return (
    <section className="min-h-full w-full p-4 sm:p-6 lg:p-8 flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Affiliate Products</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Recommend useful products to your students.</p>
          <Button className="mt-4 hidden h-11 w-full gap-2 px-4 max-[767px]:flex" onClick={openDrawer} type="button">
            <Plus aria-hidden="true" /> Add affiliate product
          </Button>
        </div>
      </div>

      <div className="flex flex-col h-full flex-1 ring-1 ring-foreground/10 mt-8 rounded-xl overflow-clip relative">
        <div className="p-4 sticky top-0 w-full bg-white z-10 flex items-center justify-between  rounded-none ring-1 ring-foreground/10">
          <div className="relative w-full max-w-130">
            <Search aria-hidden="true" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-10 bg-white pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Affiliate Course..."
              type="search"
              value={search}
            />
          </div>
          <Button className="h-11 shrink-0 gap-2 px-4 max-[767px]:hidden" onClick={openDrawer} type="button">
            <Plus aria-hidden="true" /> Add affiliate product
          </Button>
        </div>

        <Card className="gap-0 py-0 h-full relative rounded-none flex-1 ring-0">
          {loadingProducts ? (
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
          ) : filteredProducts.length ? (
            <div className="grid gap-5 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card
                  className={`group gap-0 cursor-grab overflow-hidden py-0 transition-shadow hover:shadow-md active:cursor-grabbing ${dragOverProductId === product.id ? "ring-2 ring-slate-900" : ""} ${draggedProductId === product.id ? "opacity-50" : ""}`}
                  draggable
                  key={product.id}
                  onDragEnd={() => {
                    setDraggedProductId(null);
                    setDragOverProductId(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (draggedProductId !== product.id) setDragOverProductId(product.id);
                  }}
                  onDragStart={() => setDraggedProductId(product.id)}
                  onDrop={(event) => {
                    event.preventDefault();
                    void handleProductDrop(product.id);
                  }}>
                  {product.thumbnailUrl ? (
                    <img
                      alt={`${product.title} thumbnail`}
                      className="h-48 w-full object-cover"
                      src={product.thumbnailUrl}
                    />
                  ) : (
                    <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon className="size-10" />
                    </div>
                  )}
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2"><GripVertical aria-label="Drag to reorder" className="size-4 shrink-0 text-slate-400" /><h3 className="truncate font-semibold">{product.title}</h3></div>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-200">
                        {product.status}
                      </span>
                    </div>
                    {product.description && (
                      <p className="line-clamp-2 text-sm text-slate-500">{product.description}</p>
                    )}
                    <div className="flex gap-2">
                      <ActionTooltip label="Edit product">
                        <Button aria-label={`Edit ${product.title}`} onClick={() => openEditDrawer(product)} size="icon" type="button" variant="outline">
                          <Pencil className="size-4" />
                        </Button>
                      </ActionTooltip>
                      <ActionTooltip label="Delete product">
                        <Button aria-label={`Delete ${product.title}`} size="icon" type="button" variant="outline">
                          <Trash2 className="size-4" />
                        </Button>
                      </ActionTooltip>
                      <Button
                        className="ml-auto gap-2"
                        disabled={!product?.affiliateLink?.trim()}
                        onClick={() =>
                          product.affiliateLink && window.open(product.affiliateLink, "_blank", "noopener,noreferrer")
                        }
                        type="button"
                        variant="outline">
                        {product.buttonTitle || "Open product"}
                        <ExternalLink className="size-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex min-h-96 flex-col items-center justify-center px-6 py-16 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <ImageIcon className="size-7" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-950">No affiliate products yet</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                Add products you want to recommend to your students.
              </p>
              <Button className="mt-5 h-10 gap-2" onClick={openDrawer} type="button">
                <Plus className="size-4" /> Add affiliate product
              </Button>
            </div>
          )}
        </Card>
      </div>

      <UploadAffiliateProductSidebar
        errors={errors}
        formData={formData}
        isEditing={isEditing}
        editingProductId={editingProductId}
        isDrawerOpen={isDrawerOpen}
        pendingThumbnail={pendingThumbnail}
        setErrors={setErrors}
        setFormData={setFormData}
        setIsDrawerOpen={setIsDrawerOpen}
        setPendingThumbnail={setPendingThumbnail}
        setThumbnailPreview={setThumbnailPreview}
        thumbnailPreview={thumbnailPreview}
        reFetchAffiliateProducts={reFetchAffiliateProducts}
      />
    </section>
  );
}

export default AffiliateProductManagementPage;

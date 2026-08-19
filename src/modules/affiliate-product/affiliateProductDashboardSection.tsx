import { ArrowRight, ExternalLink, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/variants/toast.manager";
import { useDebounce } from "@/hooks/useDebounce";
import { multipleApiHandler } from "@/utils/api/multiple.api";
import type { AffiliateProduct } from "@/utils/interface/affiliate-product.interface";

function AffiliateProductDashboardSection() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAffiliateProducts = useDebounce(async () => {
    try {
      const response = await multipleApiHandler([
        { endPoint: "/affiliate-product/fetch", method: "GET", protected: true },
      ]);
      const result = response[0];
      const fetchedProducts =
        result?.data?.success && Array.isArray(result.data.data?.products) ? result.data.data.products : [];
      setProducts(fetchedProducts);
      if (!result?.data?.success)
        toast.add({
          title: "Affiliate products could not be loaded",
          description: result?.data?.message ?? "Please try again.",
          type: "error",
        });
    } finally {
      setIsLoading(false);
    }
  }, 100);

  useEffect(() => {
    fetchAffiliateProducts();
  }, [fetchAffiliateProducts]);

  return (
    <Card className="min-h-0 gap-0 overflow-hidden rounded-none border-0 py-0 ring-0">
      <CardHeader className="border-y rounded-none px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-lg">Affiliate products</CardTitle>
          <Button
            className="h-9 px-3 text-xs"
            onClick={() => navigate("/affiliate-products")}
            type="button"
            variant="ghost">
            View all <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <p className="text-sm leading-5 text-slate-500">Products recommended to your students.</p>
      </CardHeader>
      {isLoading ? (
        <div className="space-y-4 overflow-y-auto p-5">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex items-center gap-3" key={index}>
              <Skeleton className="size-12 rounded-lg bg-slate-300" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 bg-slate-300" />
                <Skeleton className="h-3 w-1/2 bg-slate-300" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length ? (
        <div className="min-h-0 overflow-y-auto divide-y">
          {products.map((product) => (
            <CardContent className="flex items-center gap-3 px-5 py-4" key={product.id}>
              {product.thumbnailUrl ? (
                <img alt="" className="size-12 shrink-0 rounded-lg object-cover" src={product.thumbnailUrl} />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <ImageIcon className="size-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{product.title}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{product.description || "Recommended product"}</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {product.status}
              </span>
              <Button
                aria-label={`Open ${product.title}`}
                className="size-8 shrink-0"
                onClick={() =>
                  product.affiliateLink && window.open(product.affiliateLink, "_blank", "noopener,noreferrer")
                }
                size="icon"
                type="button"
                variant="ghost">
                <ExternalLink className="size-4" />
              </Button>
            </CardContent>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <ImageIcon className="size-8 text-slate-400" />
          <h3 className="mt-3 font-semibold">No affiliate products yet</h3>
          <p className="mt-1 text-sm text-slate-500">Add products to see them here.</p>
        </div>
      )}
    </Card>
  );
}

export default AffiliateProductDashboardSection;

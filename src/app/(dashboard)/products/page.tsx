"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Tag,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react";

import { productApi } from "@/lib/api/product";
import { brandApi } from "@/lib/api/brand";
import { categoryApi } from "@/lib/api/category";
import { usePermission } from "@/lib/hooks/use-permission";
import { Product, Brand, CategoryTreeNode } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { ProductForm } from "@/components/modules/product/product-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductsPage() {
  const hasWatchPermission = usePermission("product:watch");

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [categoryIdFilter, setCategoryIdFilter] = useQueryState("categoryId", parseAsString.withDefault(""));
  const [brandIdFilter, setBrandIdFilter] = useQueryState("brandId", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("active", parseAsString.withDefault(""));
  const [hasVariantsFilter, setHasVariantsFilter] = useQueryState("hasVariants", parseAsString.withDefault(""));

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeParam =
    statusFilter === "true" ? true : statusFilter === "false" ? false : undefined;
  const variantsParam =
    hasVariantsFilter === "true" ? true : hasVariantsFilter === "false" ? false : undefined;

  // Fetch Brands for filter dropdown
  const { data: brandsRes } = useQuery({
    queryKey: ["all-brands-filter"],
    queryFn: () => brandApi.listBrands({ limit: 100 }),
    enabled: hasWatchPermission,
  });
  const brands: Brand[] = brandsRes?.data || [];

  // Fetch Categories for filter dropdown
  const { data: categoriesRes } = useQuery({
    queryKey: ["all-categories-filter"],
    queryFn: () => categoryApi.listCategories({ limit: 100 }),
    enabled: hasWatchPermission,
  });
  const categories = categoriesRes?.data || [];

  // Fetch Products List
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["products-list", page, limit, search, categoryIdFilter, brandIdFilter, statusFilter, hasVariantsFilter],
    queryFn: () =>
      productApi.listProducts({
        page,
        limit,
        search: search || undefined,
        categoryId: categoryIdFilter || undefined,
        brandId: brandIdFilter || undefined,
        active: activeParam,
        hasVariants: variantsParam,
      }),
    enabled: hasWatchPermission,
  });

  const products: Product[] = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Products Catalog"
        requiredPermission="product:watch"
      />
    );
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    setDeletingError(null);

    try {
      const res = await productApi.deleteProduct(deletingProduct.id);
      if (res.success) {
        toast.success(`Product "${deletingProduct.name}" deleted successfully`);
        setDeletingProduct(null);
        refetch();
      } else {
        setDeletingError(res.message || "Failed to delete product");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to delete product";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: "Product Details",
      cell: ({ row }) => {
        const p = row.original;
        const thumbSrc = p.thumbnail?.thumbnailUrl || p.thumbnail?.publicUrl;

        return (
          <div className="flex items-center gap-3">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt={p.name}
                className="w-10 h-10 object-cover rounded-lg border border-slate-800 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Package className="w-4 h-4" />
              </div>
            )}
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100">{p.name}</span>
                {p.featured && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] px-1 py-0 gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> FEATURED
                  </Badge>
                )}
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                <span>SKU: {p.sku || (p.hasVariants ? "Multiple SKUs" : "N/A")}</span>
                <span>/{p.slug}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "brand",
      header: "Brand & Category",
      cell: ({ row }) => {
        const p = row.original;
        const brandName = p.brand?.name || "Unbranded";
        const catNames = p.categories.map((c) => c.name).join(", ");

        return (
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-blue-400" />
              <Badge variant="outline" className="bg-slate-900 border-slate-800 text-blue-300 text-[10px]">
                {brandName}
              </Badge>
            </div>
            {catNames && (
              <span className="text-[11px] text-slate-400 block truncate max-w-[180px]" title={catNames}>
                {catNames}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Pricing",
      cell: ({ row }) => {
        const p = row.original;
        if (p.hasVariants) {
          const min = p.priceMin !== undefined && p.priceMin !== null ? `$${p.priceMin.toFixed(2)}` : "";
          const max = p.priceMax !== undefined && p.priceMax !== null ? `$${p.priceMax.toFixed(2)}` : "";
          const range = min && max ? (min === max ? min : `${min} – ${max}`) : "Variable";
          return (
            <div className="flex items-center gap-1 font-mono text-xs text-pink-400 font-bold">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span>{range}</span>
            </div>
          );
        }

        const price = p.price !== undefined && p.price !== null ? `$${p.price.toFixed(2)}` : "$0.00";
        const sale = p.salePrice !== undefined && p.salePrice !== null ? `$${p.salePrice.toFixed(2)}` : null;

        return (
          <div className="font-mono text-xs space-y-0.5">
            {sale ? (
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">{sale}</span>
                <span className="text-slate-500 line-through text-[11px]">{price}</span>
              </div>
            ) : (
              <span className="text-slate-200 font-semibold">{price}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stock",
      header: "Inventory",
      cell: ({ row }) => {
        const p = row.original;
        if (p.hasVariants) {
          return (
            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px]">
              {p.variants?.length || 0} Variants
            </Badge>
          );
        }

        const stock = p.stock ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-mono font-bold ${stock > 0 ? "text-slate-200" : "text-red-400"}`}>
              {stock} units
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.original.active
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {row.original.active ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Can I="product:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingProduct(product)}
                title="Edit Product"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="product:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingProduct(product);
                }}
                title="Delete Product"
                className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Can>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Products Catalog"
        description="Manage simple &amp; variable products, inventory, prices, and taxonomy"
      >
        <Can I="product:create">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium text-xs h-9"
          >
            <Plus className="w-4 h-4" />
            New Product
          </Button>
        </Can>
      </PageHeader>

      {/* Filter Control Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400 font-medium">Brand:</span>
          <Select
            value={brandIdFilter || "ALL"}
            onValueChange={(val) => setBrandIdFilter(val === "ALL" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[140px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />
          <span className="text-slate-400 font-medium">Category:</span>
          <Select
            value={categoryIdFilter || "ALL"}
            onValueChange={(val) => setCategoryIdFilter(val === "ALL" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[150px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-pink-400" />
          <span className="text-slate-400 font-medium">Type:</span>
          <Select
            value={hasVariantsFilter || "ALL"}
            onValueChange={(val) => setHasVariantsFilter(val === "ALL" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[130px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="false">Simple Only</SelectItem>
              <SelectItem value="true">Variable Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(val) => setStatusFilter(val === "ALL" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[120px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="true">Active Only</SelectItem>
              <SelectItem value="false">Inactive Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={products}
        totalCount={meta.total}
        totalPages={meta.totalPages}
        isLoading={isLoading}
        searchPlaceholder="Search products by name, SKU, or slug..."
      />

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New Product"
        description="Configure product general details, taxonomy, simple pricing, or variable mode."
      >
        <ProductForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        title={`Edit Product: ${editingProduct?.name || ""}`}
        description="Update product general details, brand, or categories."
      >
        <ProductForm
          initialData={editingProduct}
          onSuccess={() => {
            setEditingProduct(null);
            refetch();
          }}
          onCancel={() => setEditingProduct(null)}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingProduct}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title={`Delete Product: ${deletingProduct?.name}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingProduct?.name}</strong>?
            This will permanently remove the product and all associated variants.
          </span>
        }
        confirmText="Delete Product"
        onConfirm={handleDeleteProduct}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

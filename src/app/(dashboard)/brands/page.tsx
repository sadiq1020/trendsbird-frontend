"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Tag, Package } from "lucide-react";

import { brandApi } from "@/lib/api/brand";
import { usePermission } from "@/lib/hooks/use-permission";
import { Brand } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { BrandForm } from "@/components/modules/brand/brand-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BrandsPage() {
  const hasWatchPermission = usePermission("brand:watch");

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("status", parseAsString.withDefault("ALL"));

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusParam =
    statusFilter === "true" ? true : statusFilter === "false" ? false : undefined;

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["brands-list", page, limit, search, statusFilter],
    queryFn: () =>
      brandApi.listBrands({
        page,
        limit,
        search: search || undefined,
        status: statusParam,
      }),
    enabled: hasWatchPermission,
  });

  const brands: Brand[] = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Brands Management"
        requiredPermission="brand:watch"
      />
    );
  }

  const handleDeleteBrand = async () => {
    if (!deletingBrand) return;
    setIsDeleting(true);
    setDeletingError(null);

    try {
      const res = await brandApi.deleteBrand(deletingBrand.id);
      if (res.success) {
        toast.success(`Brand "${deletingBrand.name}" deleted successfully`);
        setDeletingBrand(null);
        refetch();
      } else {
        setDeletingError(res.message || "Failed to delete brand");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to delete brand";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Brand>[] = [
    {
      accessorKey: "name",
      header: "Brand Details",
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex items-center gap-3">
            {brand.logo ? (
              <img
                src={brand.logo}
                alt={brand.name}
                className="w-10 h-10 object-contain rounded-lg border border-slate-800 bg-slate-950 p-1 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 font-bold shrink-0">
                <Tag className="w-4 h-4" />
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-100 block">{brand.name}</span>
              <span className="text-[11px] font-mono text-slate-400">/{brand.slug}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-xs text-slate-400 line-clamp-1">
          {row.original.description || "—"}
        </span>
      ),
    },
    {
      accessorKey: "productCount",
      header: "Products Attached",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-purple-300 font-semibold">
          <Package className="w-3.5 h-3.5 text-purple-400" />
          <span>{row.original.productCount ?? 0}</span>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`text-[10px] ${
            row.original.status
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          {row.original.status ? "ACTIVE" : "INACTIVE"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Can I="brand:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingBrand(brand)}
                title="Edit Brand"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="brand:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingBrand(brand);
                }}
                title="Delete Brand"
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
        title="Brand Management"
        description="Manage product manufacturer brands and logos"
      >
        <Can I="brand:create">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium text-xs h-9"
          >
            <Plus className="w-4 h-4" />
            New Brand
          </Button>
        </Can>
      </PageHeader>

      {/* Filter Control Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400 font-medium">Status Filter:</span>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
          >
            <SelectTrigger className="h-8 w-[140px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
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
        data={brands}
        totalCount={meta.total}
        totalPages={meta.totalPages}
        isLoading={isLoading}
        searchPlaceholder="Search brands by name or slug..."
      />

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New Brand"
        description="Add a new brand and attach a logo asset."
      >
        <BrandForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingBrand}
        onOpenChange={(open) => !open && setEditingBrand(null)}
        title={`Edit Brand: ${editingBrand?.name || ""}`}
        description="Update brand details or change logo."
      >
        <BrandForm
          initialData={editingBrand}
          onSuccess={() => {
            setEditingBrand(null);
            refetch();
          }}
          onCancel={() => setEditingBrand(null)}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingBrand}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
        title={`Delete Brand: ${deletingBrand?.name}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingBrand?.name}</strong>?
            Note: Deletion will be blocked if products are currently referencing this brand.
          </span>
        }
        confirmText="Delete Brand"
        onConfirm={handleDeleteBrand}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

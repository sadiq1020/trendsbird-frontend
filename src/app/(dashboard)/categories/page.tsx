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
  FolderTree,
  List,
  Layers,
  Folder,
  Package,
} from "lucide-react";

import { categoryApi } from "@/lib/api/category";
import { usePermission } from "@/lib/hooks/use-permission";
import { Category, CategoryTreeNode } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { CategoryTree } from "@/components/modules/category/category-tree";
import { CategoryForm } from "@/components/modules/category/category-form";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CategoriesPage() {
  const hasWatchPermission = usePermission("category:watch");

  const [viewMode, setViewMode] = useState<"tree" | "table">("tree");

  // Query Params for Table View
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Tree Data
  const { data: treeRes, isLoading: isTreeLoading, refetch: refetchTree } = useQuery({
    queryKey: ["category-tree"],
    queryFn: () => categoryApi.getCategoryTree(),
    enabled: hasWatchPermission,
  });

  // Fetch Paginated Flat List Data
  const { data: listRes, isLoading: isListLoading, refetch: refetchList } = useQuery({
    queryKey: ["category-list", page, limit, search],
    queryFn: () =>
      categoryApi.listCategories({
        page,
        limit,
        search: search || undefined,
      }),
    enabled: hasWatchPermission && viewMode === "table",
  });

  const treeNodes: CategoryTreeNode[] = treeRes?.data || [];
  const flatCategories: Category[] = listRes?.data || [];
  const meta = listRes?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Categories Management"
        requiredPermission="category:watch"
      />
    );
  }

  const handleRefresh = () => {
    refetchTree();
    if (viewMode === "table") refetchList();
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    setDeletingError(null);

    try {
      const res = await categoryApi.deleteCategory(deletingCategory.id);
      if (res.success) {
        toast.success(`Category "${deletingCategory.name}" deleted successfully`);
        setDeletingCategory(null);
        handleRefresh();
      } else {
        setDeletingError(res.message || "Failed to delete category");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to delete category";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: "name",
      header: "Category",
      cell: ({ row }) => {
        const cat = row.original;
        return (
          <div className="flex items-center gap-3">
            {cat.image ? (
              <img
                src={cat.image}
                alt={cat.name}
                className="w-9 h-9 object-cover rounded-lg border border-slate-800 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shrink-0">
                <Folder className="w-4 h-4" />
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-100 block">{cat.name}</span>
              <span className="text-[11px] font-mono text-slate-400">/{cat.slug}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "parent",
      header: "Parent Category",
      cell: ({ row }) => {
        const parent = row.original.parent;
        return parent ? (
          <span className="text-xs font-medium text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {parent.name}
          </span>
        ) : (
          <span className="text-xs text-slate-500 font-mono">Root (None)</span>
        );
      },
    },
    {
      accessorKey: "childrenCount",
      header: "Subcategories",
      cell: ({ row }) => (
        <span className="text-xs font-semibold text-slate-300">
          {row.original.childrenCount ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "productCount",
      header: "Products",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-purple-300 font-semibold">
          <Package className="w-3.5 h-3.5 text-purple-400" />
          <span>{row.original.productCount ?? 0}</span>
        </div>
      ),
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
        const cat = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Can I="category:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingCategory(cat)}
                title="Edit Category"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="category:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingCategory(cat);
                }}
                title="Delete Category"
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
        title="Category Hierarchy"
        description="Organize e-commerce products into nested category trees"
      >
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <Tabs value={viewMode} onValueChange={(val: any) => setViewMode(val)}>
            <TabsList className="bg-slate-900 border border-slate-800 text-slate-400 h-9">
              <TabsTrigger value="tree" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5 h-7">
                <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                <span>Tree View</span>
              </TabsTrigger>
              <TabsTrigger value="table" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5 h-7">
                <List className="w-3.5 h-3.5 text-purple-400" />
                <span>Flat Table</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Can I="category:create">
            <Button
              onClick={() => {
                setDefaultParentId(null);
                setIsCreateOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium text-xs h-9"
            >
              <Plus className="w-4 h-4" />
              New Category
            </Button>
          </Can>
        </div>
      </PageHeader>

      {/* Content Section */}
      {viewMode === "tree" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Hierarchical Category Tree View (Unlimited Depth)</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Click chevrons to expand / collapse
            </span>
          </div>

          {isTreeLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-900/50 rounded-xl border border-slate-800">
              Loading category hierarchy tree...
            </div>
          ) : (
            <CategoryTree
              nodes={treeNodes}
              onAddSubcategory={(parent) => {
                setDefaultParentId(parent.id);
                setIsCreateOpen(true);
              }}
              onEdit={(node) => setEditingCategory(node)}
              onDelete={(node) => {
                setDeletingError(null);
                setDeletingCategory(node);
              }}
            />
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={flatCategories}
          totalCount={meta.total}
          totalPages={meta.totalPages}
          isLoading={isListLoading}
          searchPlaceholder="Search categories by name or slug..."
        />
      )}

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Category"
        description="Add a new root category or subcategory to your catalog hierarchy."
      >
        <CategoryForm
          defaultParentId={defaultParentId}
          treeNodes={treeNodes}
          onSuccess={() => {
            setIsCreateOpen(false);
            handleRefresh();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        title={`Edit Category: ${editingCategory?.name || ""}`}
        description="Update category name, parent hierarchy, or active status."
      >
        <CategoryForm
          initialData={editingCategory}
          treeNodes={treeNodes}
          onSuccess={() => {
            setEditingCategory(null);
            handleRefresh();
          }}
          onCancel={() => setEditingCategory(null)}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title={`Delete Category: ${deletingCategory?.name}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingCategory?.name}</strong>?
            Note: Deletion will be rejected by backend if subcategories or products are attached to it.
          </span>
        }
        confirmText="Delete Category"
        onConfirm={handleDeleteCategory}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

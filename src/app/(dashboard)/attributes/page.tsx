"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Sliders, Palette, ListFilter, CheckSquare, Image as ImageIcon, CircleDot, Layers } from "lucide-react";

import { attributeApi } from "@/lib/api/attribute";
import { usePermission } from "@/lib/hooks/use-permission";
import { Attribute, AttributeType } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { AttributeForm } from "@/components/modules/attribute/attribute-form";
import { ValueList } from "@/components/modules/attribute/value-list";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AttributesPage() {
  const hasWatchPermission = usePermission("attribute:watch");

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [typeFilter, setTypeFilter] = useQueryState("type", parseAsString.withDefault("ALL"));

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);
  const [managingValuesAttr, setManagingValuesAttr] = useState<Attribute | null>(null);
  const [deletingAttribute, setDeletingAttribute] = useState<Attribute | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeParam: AttributeType | undefined =
    typeFilter !== "ALL" ? (typeFilter as AttributeType) : undefined;

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["attributes-list", page, limit, search, typeFilter],
    queryFn: () =>
      attributeApi.listAttributes({
        page,
        limit,
        search: search || undefined,
        type: typeParam,
      }),
    enabled: hasWatchPermission,
  });

  const attributes: Attribute[] = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Attributes Management"
        requiredPermission="attribute:watch"
      />
    );
  }

  const handleDeleteAttribute = async () => {
    if (!deletingAttribute) return;
    setIsDeleting(true);
    setDeletingError(null);

    try {
      const res = await attributeApi.deleteAttribute(deletingAttribute.id);
      if (res.success) {
        toast.success(`Attribute "${deletingAttribute.name}" deleted successfully`);
        setDeletingAttribute(null);
        refetch();
      } else {
        setDeletingError(res.message || "Failed to delete attribute");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to delete attribute";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTypeIcon = (type: AttributeType) => {
    switch (type) {
      case "COLOR_SWATCH":
        return <Palette className="w-3.5 h-3.5 text-pink-400" />;
      case "IMAGE_SWATCH":
        return <ImageIcon className="w-3.5 h-3.5 text-amber-400" />;
      case "RADIO":
        return <CircleDot className="w-3.5 h-3.5 text-emerald-400" />;
      case "CHECKBOX":
        return <CheckSquare className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <ListFilter className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const columns: ColumnDef<Attribute>[] = [
    {
      accessorKey: "name",
      header: "Attribute",
      cell: ({ row }) => {
        const attr = row.original;
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-100 block">{attr.name}</span>
            <span className="text-[11px] font-mono text-slate-400">/{attr.slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Display Type",
      cell: ({ row }) => {
        const type = row.original.type;
        return (
          <div className="flex items-center gap-1.5">
            {renderTypeIcon(type)}
            <Badge variant="outline" className="bg-slate-900 border-slate-800 text-slate-200 text-[10px] font-mono">
              {type}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "values",
      header: "Values Preview",
      cell: ({ row }) => {
        const values = row.original.values || [];
        const preview = values.slice(0, 4);
        const remaining = values.length - preview.length;

        return (
          <div className="flex flex-wrap items-center gap-1">
            {preview.map((v) => (
              <span
                key={v.id}
                className="px-2 py-0.5 text-[11px] rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono flex items-center gap-1"
              >
                {row.original.type === "COLOR_SWATCH" && v.referenceValue && (
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-slate-700"
                    style={{ backgroundColor: v.referenceValue }}
                  />
                )}
                {v.value}
              </span>
            ))}
            {remaining > 0 && (
              <span className="text-[10px] text-slate-400 font-semibold">+{remaining} more</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const attr = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManagingValuesAttr(attr)}
              className="border-slate-800 bg-slate-900 text-blue-400 hover:bg-slate-800 text-xs h-7 gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Values ({attr.values?.length || 0})</span>
            </Button>

            <Can I="attribute:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingAttribute(attr)}
                title="Edit Attribute"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="attribute:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingAttribute(attr);
                }}
                title="Delete Attribute"
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
        title="Product Attributes"
        description="Define variant attributes (Color, Size, Material) for product generator"
      >
        <Can I="attribute:create">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium text-xs h-9"
          >
            <Plus className="w-4 h-4" />
            New Attribute
          </Button>
        </Can>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <span className="text-slate-400 font-medium">Display Type Filter:</span>
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val)}
          >
            <SelectTrigger className="h-8 w-[160px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="DROPDOWN">Dropdown</SelectItem>
              <SelectItem value="RADIO">Radio Buttons</SelectItem>
              <SelectItem value="CHECKBOX">Checkboxes</SelectItem>
              <SelectItem value="COLOR_SWATCH">Color Swatches</SelectItem>
              <SelectItem value="IMAGE_SWATCH">Image Swatches</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={attributes}
        totalCount={meta.total}
        totalPages={meta.totalPages}
        isLoading={isLoading}
        searchPlaceholder="Search attributes by name or slug..."
      />

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Product Attribute"
        description="Define a new variant attribute name and display type."
      >
        <AttributeForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingAttribute}
        onOpenChange={(open) => !open && setEditingAttribute(null)}
        title={`Edit Attribute: ${editingAttribute?.name || ""}`}
        description="Update attribute name or display type."
      >
        <AttributeForm
          initialData={editingAttribute}
          onSuccess={() => {
            setEditingAttribute(null);
            refetch();
          }}
          onCancel={() => setEditingAttribute(null)}
        />
      </FormModal>

      {/* Manage Values Modal */}
      <FormModal
        open={!!managingValuesAttr}
        onOpenChange={(open) => !open && setManagingValuesAttr(null)}
        title={`Manage Values: ${managingValuesAttr?.name || ""}`}
        description="Add, edit, or remove attribute values &amp; swatch references."
      >
        {managingValuesAttr && (
          <ValueList
            attribute={managingValuesAttr}
            onRefresh={() => {
              refetch();
              // Re-fetch individual attribute to update state
              attributeApi.getAttribute(managingValuesAttr.id).then((res) => {
                if (res.success && res.data) setManagingValuesAttr(res.data);
              });
            }}
          />
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingAttribute}
        onOpenChange={(open) => !open && setDeletingAttribute(null)}
        title={`Delete Attribute: ${deletingAttribute?.name}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingAttribute?.name}</strong>?
            Note: Deletion will be rejected by backend if variant values are used by products.
          </span>
        }
        confirmText="Delete Attribute"
        onConfirm={handleDeleteAttribute}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

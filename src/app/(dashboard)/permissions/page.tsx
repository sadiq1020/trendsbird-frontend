"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, KeyRound, X } from "lucide-react";

import { permissionApi } from "@/lib/api/permission";
import { usePermission } from "@/lib/hooks/use-permission";
import { PermissionGroup, PermissionAction } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { GroupForm } from "@/components/modules/permission/group-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PermissionsPage() {
  const hasWatchPermission = usePermission("permission:watch");
  const canUpdate = usePermission("permission:update");
  const canDelete = usePermission("permission:delete");

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));

  // Dialog / Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<PermissionGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<PermissionGroup | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch groups with React Query
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["permissions-groups", page, limit, search],
    queryFn: () => permissionApi.listGroups({ page, limit, search }),
    enabled: hasWatchPermission,
  });

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Permissions Management"
        requiredPermission="permission:watch"
      />
    );
  }

  const groups = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setDeletingError(null);
    setIsDeleting(true);
    try {
      const res = await permissionApi.deleteGroup(deletingGroup.id);
      if (res.success) {
        toast.success(`Permission group "${deletingGroup.name}" deleted`);
        setDeletingGroup(null);
        refetch();
      } else {
        setDeletingError(res.message || "Failed to delete group");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Backend refused group deletion";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveSingleAction = async (groupId: string, permission: PermissionAction) => {
    try {
      const res = await permissionApi.removeAction(groupId, permission.id);
      if (res.success) {
        toast.success(`Action "${permission.name}" removed`);
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to remove action");
    }
  };

  const columns: ColumnDef<PermissionGroup>[] = [
    {
      accessorKey: "name",
      header: "Group / Module",
      cell: ({ row }) => {
        const group = row.original;
        return (
          <div className="space-y-1">
            <div className="font-semibold text-slate-100 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{group.name}</span>
            </div>
            {group.description && (
              <p className="text-xs text-slate-400 line-clamp-1">{group.description}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "permissions",
      header: "Actions & Permissions",
      cell: ({ row }) => {
        const perms = row.original.permissions || [];
        if (perms.length === 0) {
          return <span className="text-xs text-slate-500 italic">No actions defined</span>;
        }

        return (
          <div className="flex flex-wrap gap-1.5 max-w-xl">
            {perms.map((p) => (
              <Badge
                key={p.id}
                variant="outline"
                className="bg-slate-950/80 border-slate-800 text-slate-300 font-mono text-xs px-2 py-0.5 flex items-center gap-1"
              >
                <span>{p.name}</span>
                {canDelete && (
                  <button
                    onClick={() => handleRemoveSingleAction(row.original.id, p)}
                    title={`Remove ${p.name}`}
                    className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const group = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Can I="permission:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingGroup(group)}
                title="Edit Group"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="permission:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingGroup(group);
                }}
                title="Delete Group"
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
    <div className="space-y-6">
      <PageHeader
        title="Permission Groups"
        description="Configure module permission groups and standard/custom action prefixes"
      >
        <Can I="permission:create">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Group
          </Button>
        </Can>
      </PageHeader>

      <DataTable
        columns={columns}
        data={groups}
        totalCount={meta.total}
        totalPages={meta.totalPages}
        isLoading={isLoading}
        searchPlaceholder="Search permission groups..."
      />

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create Permission Group"
        description="Define a new module permission group with standard or custom actions."
      >
        <GroupForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingGroup}
        onOpenChange={(open) => !open && setEditingGroup(null)}
        title={`Edit Group: ${editingGroup?.name || ""}`}
        description="Update group details or append new actions."
      >
        <GroupForm
          initialData={editingGroup}
          onSuccess={() => {
            setEditingGroup(null);
            refetch();
          }}
          onCancel={() => setEditingGroup(null)}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingGroup}
        onOpenChange={(open) => !open && setDeletingGroup(null)}
        title={`Delete Permission Group?`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingGroup?.name}</strong>?
            This will cascade and remove all associated permission actions.
          </span>
        }
        confirmText="Delete Group"
        onConfirm={handleDeleteGroup}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

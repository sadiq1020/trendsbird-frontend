"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, ShieldCheck, Users, Key } from "lucide-react";

import { roleApi } from "@/lib/api/role";
import { usePermission } from "@/lib/hooks/use-permission";
import { Role } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { RoleForm } from "@/components/modules/role/role-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RolesPage() {
  const hasWatchPermission = usePermission("role:watch");

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));

  // Dialog / Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch roles with React Query
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["roles-list", page, limit, search],
    queryFn: () => roleApi.listRoles({ page, limit, search }),
    enabled: hasWatchPermission,
  });

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Roles Management"
        requiredPermission="role:watch"
      />
    );
  }

  const roles = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleDeleteRole = async () => {
    if (!deletingRole) return;
    setDeletingError(null);
    setIsDeleting(true);
    try {
      const res = await roleApi.deleteRole(deletingRole.id);
      if (res.success) {
        toast.success(`Role "${deletingRole.name}" deleted successfully`);
        setDeletingRole(null);
        refetch();
      } else {
        setDeletingError(res.message || "Failed to delete role");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Backend refused role deletion";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<Role>[] = [
    {
      accessorKey: "name",
      header: "Role Name & Description",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <div className="space-y-1">
            <div className="font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{role.name}</span>
            </div>
            {role.description && (
              <p className="text-xs text-slate-400 line-clamp-1">{role.description}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status;
        return (
          <Badge
            variant="outline"
            className={
              isActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                : "bg-slate-800 text-slate-400 border-slate-700 text-xs"
            }
          >
            {isActive ? "ACTIVE" : "INACTIVE"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "userCount",
      header: "Assigned Users",
      cell: ({ row }) => {
        const count = row.original.userCount ?? 0;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-semibold">{count}</span>
            <span className="text-slate-500">user(s)</span>
          </div>
        );
      },
    },
    {
      accessorKey: "permissions",
      header: "Permissions Granted",
      cell: ({ row }) => {
        const count = row.original.permissions?.length || 0;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">{count}</span>
            <span className="text-slate-500">permission(s)</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const role = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Can I="role:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingRole(role)}
                title="Edit Role & Permissions"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="role:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingRole(role);
                }}
                title="Delete Role"
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
        title="Roles &amp; Permissions Matrix"
        description="Manage user roles, granted module permissions, and status"
      >
        <Can I="role:create">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Role
          </Button>
        </Can>
      </PageHeader>

      <DataTable
        columns={columns}
        data={roles}
        totalCount={meta.total}
        totalPages={meta.totalPages}
        isLoading={isLoading}
        searchPlaceholder="Search roles..."
      />

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New Role"
        description="Define a new role and grant module permissions using the matrix grid."
        variant="dialog"
      >
        <RoleForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingRole}
        onOpenChange={(open) => !open && setEditingRole(null)}
        title={`Edit Role: ${editingRole?.name || ""}`}
        description="Update role details or modify granted permissions."
        variant="dialog"
      >
        <RoleForm
          initialData={editingRole}
          onSuccess={() => {
            setEditingRole(null);
            refetch();
          }}
          onCancel={() => setEditingRole(null)}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
        title={`Delete Role: ${deletingRole?.name}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingRole?.name}</strong>?
            This operation will be rejected by the backend if users are still assigned to this role.
          </span>
        }
        confirmText="Delete Role"
        onConfirm={handleDeleteRole}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

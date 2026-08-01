"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Users, Shield, Mail } from "lucide-react";

import { userApi } from "@/lib/api/user";
import { roleApi } from "@/lib/api/role";
import { usePermission } from "@/lib/hooks/use-permission";
import { useSessionStore } from "@/lib/stores/session-store";
import { User, Role } from "@/types";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { DataTable } from "@/components/shared/data-table";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Can } from "@/components/shared/can";
import { UserForm } from "@/components/modules/user/user-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UsersPage() {
  const hasWatchPermission = usePermission("user:watch");
  const currentUser = useSessionStore((state) => state.user);

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(10));
  const [search] = useQueryState("search", parseAsString.withDefault(""));
  const [roleIdFilter, setRoleIdFilter] = useQueryState("roleId", parseAsString.withDefault(""));
  const [statusFilter, setStatusFilter] = useQueryState("active", parseAsString.withDefault(""));

  // Dialog / Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Convert active filter string to boolean or undefined
  const activeParam =
    statusFilter === "true" ? true : statusFilter === "false" ? false : undefined;

  // Fetch roles for list filter dropdown
  const { data: rolesRes } = useQuery({
    queryKey: ["all-roles-filter"],
    queryFn: () => roleApi.listRoles({ limit: 100 }),
    enabled: hasWatchPermission,
  });
  const roles: Role[] = rolesRes?.data || [];

  // Fetch users with React Query
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["users-list", page, limit, search, roleIdFilter, statusFilter],
    queryFn: () =>
      userApi.listUsers({
        page,
        limit,
        search: search || undefined,
        roleId: roleIdFilter || undefined,
        active: activeParam,
      }),
    enabled: hasWatchPermission,
  });

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Users Management"
        requiredPermission="user:watch"
      />
    );
  }

  const users = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error("Self-escalation prevented: You cannot change your own active status");
      return;
    }

    const newStatus = !user.active;
    try {
      const res = await userApi.updateUser(user.id, { active: newStatus });
      if (res.success) {
        toast.success(`User ${user.name} is now ${newStatus ? "ACTIVE" : "INACTIVE"}`);
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeletingError(null);
    setIsDeleting(true);
    try {
      const res = await userApi.deleteUser(deletingUser.id);
      if (res.success) {
        toast.success(`User "${deletingUser.name}" deleted permanently`);
        setDeletingUser(null);
        refetch();
      } else {
        setDeletingError(res.message || "Failed to delete user");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Backend refused user deletion";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User Details",
      cell: ({ row }) => {
        const user = row.original;
        const initials = user.name
          ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "U";

        const isSelf = user.id === currentUser?.id;

        return (
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-slate-800 shrink-0">
              <AvatarImage src={user.avatar || undefined} alt={user.name} />
              <AvatarFallback className="bg-blue-600/30 text-blue-300 font-bold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <div className="font-semibold text-slate-100 flex items-center gap-2">
                <span>{user.name}</span>
                {isSelf && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/40 text-[10px] px-1.5 py-0">
                    YOU
                  </Badge>
                )}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" />
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Assigned Role",
      cell: ({ row }) => {
        const roleName = row.original.role?.name || "No Role";
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <Badge variant="outline" className="bg-slate-900 border-slate-800 text-emerald-400 font-medium">
              {roleName}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentUser?.id;

        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={user.active}
              onCheckedChange={() => handleToggleStatus(user)}
              disabled={isSelf}
              className="data-[state=checked]:bg-emerald-600"
            />
            <span
              className={`text-xs font-semibold ${
                user.active ? "text-emerald-400" : "text-slate-500"
              }`}
            >
              {user.active ? "ACTIVE" : "INACTIVE"}
            </span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <div className="flex items-center justify-end gap-1">
            <Can I="user:update">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditingUser(user)}
                title="Edit User"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </Can>

            <Can I="user:delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingError(null);
                  setDeletingUser(user);
                }}
                title="Delete User"
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
        title="User Accounts"
        description="Manage admin panel users, assigned roles, and access statuses"
      >
        <Can I="user:create">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            New User
          </Button>
        </Can>
      </PageHeader>

      {/* Role and Status Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Filters:</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Role:</span>
          <Select
            value={roleIdFilter || "ALL"}
            onValueChange={(val) => setRoleIdFilter(val === "ALL" ? null : val)}
          >
            <SelectTrigger className="h-8 w-[160px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Roles</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Status:</span>
          <Select
            value={statusFilter || "ALL"}
            onValueChange={(val) => setStatusFilter(val === "ALL" ? null : val)}
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

        {(roleIdFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRoleIdFilter(null);
              setStatusFilter(null);
            }}
            className="text-xs text-slate-400 hover:text-slate-200 h-8"
          >
            Reset Filters
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        totalCount={meta.total}
        totalPages={meta.totalPages}
        isLoading={isLoading}
        searchPlaceholder="Search users by name or email..."
      />

      {/* Create Modal */}
      <FormModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Create New User"
        description="Create a new user account with credentials and assigned role."
      >
        <UserForm
          onSuccess={() => {
            setIsCreateOpen(false);
            refetch();
          }}
          onCancel={() => setIsCreateOpen(false)}
        />
      </FormModal>

      {/* Edit Modal */}
      <FormModal
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        title={`Edit User: ${editingUser?.name || ""}`}
        description="Update user information or assigned role."
      >
        <UserForm
          initialData={editingUser}
          onSuccess={() => {
            setEditingUser(null);
            refetch();
          }}
          onCancel={() => setEditingUser(null)}
        />
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title={`Delete User: ${deletingUser?.name}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingUser?.name}</strong>?
            This will permanently remove their user account and login credentials.
          </span>
        }
        confirmText="Delete Account"
        onConfirm={handleDeleteUser}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

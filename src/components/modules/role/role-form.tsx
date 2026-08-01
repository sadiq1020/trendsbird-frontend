"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckSquare, ShieldAlert, Sparkles } from "lucide-react";

import { createRoleSchema, CreateRoleInput } from "@/lib/schemas/role.schema";
import { roleApi } from "@/lib/api/role";
import { permissionApi } from "@/lib/api/permission";
import { Role, PermissionGroup } from "@/types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

interface RoleFormProps {
  initialData?: Role | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RoleForm({ initialData, onSuccess, onCancel }: RoleFormProps) {
  const isEditing = !!initialData;
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch full role details if editing (to ensure complete permission list)
  const { data: fullRoleRes, isLoading: isRoleLoading } = useQuery({
    queryKey: ["role-detail", initialData?.id],
    queryFn: () => roleApi.getRole(initialData!.id),
    enabled: isEditing && !!initialData?.id,
  });

  // Fetch all permission groups to build matrix grid
  const { data: groupsRes, isLoading: isGroupsLoading } = useQuery({
    queryKey: ["permission-groups-all"],
    queryFn: () => permissionApi.listGroups({ limit: 100 }),
  });

  const permissionGroups: PermissionGroup[] = groupsRes?.data || [];

  // Extract all available permission IDs across all groups
  const allAvailablePermissionIds = useMemo(() => {
    const ids: string[] = [];
    permissionGroups.forEach((g) => {
      g.permissions?.forEach((p) => ids.push(p.id));
    });
    return ids;
  }, [permissionGroups]);

  const form = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      status: initialData?.status ?? true,
      permissionIds: [],
    },
  });

  // Pre-tick permission IDs when editing
  useEffect(() => {
    if (isEditing) {
      const activeRole = fullRoleRes?.data || initialData;
      if (activeRole?.permissions) {
        const initialIds = activeRole.permissions.map((p) => p.id);
        setSelectedPermissionIds(initialIds);
        form.setValue("permissionIds", initialIds);
      }
    }
  }, [isEditing, fullRoleRes, initialData, form]);

  const isSubmitting = form.formState.isSubmitting;

  // Toggle single permission ID
  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) => {
      const updated = prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id];
      form.setValue("permissionIds", updated);
      return updated;
    });
  };

  // Toggle all permissions for a specific group
  const toggleGroupPermissions = (group: PermissionGroup) => {
    const groupPermIds = group.permissions.map((p) => p.id);
    const allGroupSelected = groupPermIds.every((id) => selectedPermissionIds.includes(id));

    setSelectedPermissionIds((prev) => {
      let updated: string[];
      if (allGroupSelected) {
        updated = prev.filter((id) => !groupPermIds.includes(id));
      } else {
        const toAdd = groupPermIds.filter((id) => !prev.includes(id));
        updated = [...prev, ...toAdd];
      }
      form.setValue("permissionIds", updated);
      return updated;
    });
  };

  // Grant All Shortcut
  const handleGrantAll = () => {
    const allSelected = allAvailablePermissionIds.every((id) => selectedPermissionIds.includes(id));
    if (allSelected) {
      setSelectedPermissionIds([]);
      form.setValue("permissionIds", []);
    } else {
      setSelectedPermissionIds(allAvailablePermissionIds);
      form.setValue("permissionIds", allAvailablePermissionIds);
    }
  };

  const onSubmit = async (data: CreateRoleInput) => {
    setServerError(null);

    const payload = {
      name: data.name,
      description: data.description,
      status: data.status,
      permissionIds: selectedPermissionIds,
    };

    try {
      if (isEditing && initialData) {
        const response = await roleApi.updateRole(initialData.id, payload);
        if (response.success) {
          toast.success("Role updated successfully");
          onSuccess();
        } else {
          setServerError(response.message || "Failed to update role");
          toast.error(response.message || "Failed to update role");
        }
      } else {
        const response = await roleApi.createRole(payload);
        if (response.success) {
          toast.success("Role created successfully");
          onSuccess();
        } else {
          setServerError(response.message || "Failed to create role");
          toast.error(response.message || "Failed to create role");
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.details || "Backend error occurred";
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const isAllGranted =
    allAvailablePermissionIds.length > 0 &&
    allAvailablePermissionIds.every((id) => selectedPermissionIds.includes(id));

  const isLoadingData = isGroupsLoading || (isEditing && isRoleLoading);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {serverError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Action Refused by Backend Guard</span>
              <p className="text-red-300/90 text-xs mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Role Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Content Manager"
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
                <div>
                  <FormLabel className="text-slate-200 font-semibold">Role Status</FormLabel>
                  <FormDescription className="text-xs text-slate-400">
                    {field.value ? "Role is active and assignable" : "Role is inactive"}
                  </FormDescription>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                  <span className={`text-xs font-semibold ${field.value ? "text-emerald-400" : "text-slate-500"}`}>
                    {field.value ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Summary of responsibilities for this role"
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 resize-none h-16"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        {/* Module x Action Permission Matrix Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-400" />
                <span>Module Permission Matrix</span>
              </h3>
              <p className="text-xs text-slate-400">
                Granted: <span className="font-semibold text-blue-400">{selectedPermissionIds.length}</span> of{" "}
                {allAvailablePermissionIds.length} permissions
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGrantAll}
              disabled={isLoadingData}
              className="border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 text-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAllGranted ? "Deselect All" : "Grant All Permissions"}
            </Button>
          </div>

          {isLoadingData ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-8 w-full bg-slate-800" />
              <Skeleton className="h-8 w-full bg-slate-800" />
              <Skeleton className="h-8 w-full bg-slate-800" />
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60 max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="p-3 font-semibold text-slate-400 w-1/4">Module Group</th>
                    <th className="p-3 font-semibold text-slate-400 w-3/4">Available Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {permissionGroups.map((group) => {
                    const groupPermIds = group.permissions.map((p) => p.id);
                    const isGroupAllSelected =
                      groupPermIds.length > 0 && groupPermIds.every((id) => selectedPermissionIds.includes(id));
                    const isGroupSomeSelected =
                      groupPermIds.some((id) => selectedPermissionIds.includes(id));

                    return (
                      <tr key={group.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 align-top">
                          <label className="flex items-center gap-2 font-semibold text-slate-200 cursor-pointer hover:text-blue-400">
                            <Checkbox
                              checked={isGroupAllSelected || isGroupSomeSelected}
                              onCheckedChange={() => toggleGroupPermissions(group)}
                              className="border-slate-700 data-[state=checked]:bg-blue-600"
                            />
                            <span>{group.name}</span>
                          </label>
                          <span className="text-[11px] text-slate-500 block pl-6">
                            ({group.permissions.length} actions)
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {group.permissions.map((perm) => {
                              const actionSuffix = perm.name.includes(":") ? perm.name.split(":")[1] : perm.name;
                              const isChecked = selectedPermissionIds.includes(perm.id);

                              return (
                                <label
                                  key={perm.id}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-blue-600/20 border-blue-500/40 text-blue-200 font-semibold"
                                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                                  }`}
                                >
                                  <Checkbox
                                    checked={isChecked}
                                    onCheckedChange={() => togglePermission(perm.id)}
                                    className="border-slate-700 data-[state=checked]:bg-blue-600"
                                  />
                                  <span>:{actionSuffix}</span>
                                </label>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || isLoadingData}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Role...
              </>
            ) : isEditing ? (
              "Update Role"
            ) : (
              "Create Role"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

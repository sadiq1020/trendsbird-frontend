"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldAlert, User, Lock, Mail, Phone, Shield } from "lucide-react";

import { createUserSchema, updateUserSchema, CreateUserInput, UpdateUserInput } from "@/lib/schemas/user.schema";
import { userApi } from "@/lib/api/user";
import { roleApi } from "@/lib/api/role";
import { useSessionStore } from "@/lib/stores/session-store";
import { User as UserType, Role } from "@/types";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UserFormProps {
  initialData?: UserType | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ initialData, onSuccess, onCancel }: UserFormProps) {
  const isEditing = !!initialData;
  const sessionUser = useSessionStore((state) => state.user);
  const isSelf = isEditing && sessionUser?.id === initialData?.id;

  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch active roles for role select dropdown
  const { data: rolesRes, isLoading: isRolesLoading } = useQuery({
    queryKey: ["active-roles"],
    queryFn: () => roleApi.listRoles({ limit: 100, status: true }),
  });

  const activeRoles: Role[] = rolesRes?.data || [];

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      roleId: initialData?.roleId || "",
      phone: initialData?.phone || "",
      gender: initialData?.gender || "",
      avatar: initialData?.avatar || "",
      active: initialData?.active ?? true,
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: any) => {
    setServerError(null);

    try {
      if (isEditing && initialData) {
        const updatePayload: UpdateUserInput = {
          name: values.name,
          email: values.email,
          phone: values.phone || undefined,
          gender: values.gender || undefined,
          avatar: values.avatar || undefined,
        };

        // Only include password if user typed a new one
        if (values.password && values.password.trim().length > 0) {
          updatePayload.password = values.password;
        }

        // Only include roleId and active if NOT self-editing
        if (!isSelf) {
          updatePayload.roleId = values.roleId;
          updatePayload.active = values.active;
        }

        const response = await userApi.updateUser(initialData.id, updatePayload);
        if (response.success) {
          toast.success("User updated successfully");
          onSuccess();
        } else {
          setServerError(response.message || "Failed to update user");
          toast.error(response.message || "Failed to update user");
        }
      } else {
        const createPayload: CreateUserInput = {
          name: values.name,
          email: values.email,
          password: values.password,
          roleId: values.roleId,
          phone: values.phone || undefined,
          gender: values.gender || undefined,
          avatar: values.avatar || undefined,
          active: values.active,
        };

        const response = await userApi.createUser(createPayload);
        if (response.success) {
          toast.success("User created successfully");
          onSuccess();
        } else {
          setServerError(response.message || "Failed to create user");
          toast.error(response.message || "Failed to create user");
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || err.error?.details || "Operation failed";
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Action Refused by Backend Guard</span>
              <p className="text-red-300/90 mt-0.5">{serverError}</p>
            </div>
          </div>
        )}

        {isSelf && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Self-Escalation Guard:</strong> You are editing your own profile. Your role and active status are locked.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Full Name *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      placeholder="Jane Doe"
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Email Address *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      type="email"
                      placeholder="jane@trendsbird.com"
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">
                  Password {isEditing ? "(Optional)" : "*"}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      type="password"
                      placeholder={isEditing ? "Leave blank to keep password" : "Password123!"}
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roleId"
            render={({ field }) => {
              const matchedRole =
                activeRoles.find((r) => r.id === field.value) || initialData?.role;
              const roleDisplayName = matchedRole?.name || "";

              return (
                <FormItem>
                  <FormLabel className="text-slate-200">Assign Role *</FormLabel>
                  {isSelf ? (
                    <Input
                      value={roleDisplayName || "Super Admin"}
                      disabled
                      className="bg-slate-950 border-slate-800 text-slate-400 cursor-not-allowed"
                    />
                  ) : (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isRolesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100">
                          <SelectValue placeholder="Select an explicit role...">
                            {roleDisplayName || field.value}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                        {activeRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <FormMessage className="text-red-400" />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Phone Number</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      {...field}
                      placeholder="+1 (555) 000-0000"
                      className="pl-9 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg mt-1">
                <div>
                  <FormLabel className="text-slate-200 font-semibold">Account Status</FormLabel>
                  <FormDescription className="text-xs text-slate-400">
                    {field.value ? "User can sign in" : "User is suspended/disabled"}
                  </FormDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSelf}
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
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving User...
              </>
            ) : isEditing ? (
              "Update User"
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

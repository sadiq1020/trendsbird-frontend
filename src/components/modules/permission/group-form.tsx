"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, X, Loader2 } from "lucide-react";

import {
  createPermissionGroupSchema,
  CreatePermissionGroupInput,
  STANDARD_ACTIONS,
} from "@/lib/schemas/permission.schema";
import { permissionApi } from "@/lib/api/permission";
import { PermissionGroup } from "@/types";

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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface GroupFormProps {
  initialData?: PermissionGroup | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function GroupForm({ initialData, onSuccess, onCancel }: GroupFormProps) {
  const isEditing = !!initialData;
  const [customActionInput, setCustomActionInput] = useState("");
  const [customActionsList, setCustomActionsList] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CreatePermissionGroupInput>({
    resolver: zodResolver(createPermissionGroupSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      actions: [],
      customActions: [],
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const handleAddCustomAction = () => {
    const trimmed = customActionInput.trim();
    if (!trimmed) return;
    if (customActionsList.includes(trimmed)) {
      toast.error("Custom action already added");
      return;
    }
    const updated = [...customActionsList, trimmed];
    setCustomActionsList(updated);
    form.setValue("customActions", updated);
    setCustomActionInput("");
  };

  const handleRemoveCustomAction = (actionToRemove: string) => {
    const updated = customActionsList.filter((a) => a !== actionToRemove);
    setCustomActionsList(updated);
    form.setValue("customActions", updated);
  };

  const onSubmit = async (data: CreatePermissionGroupInput) => {
    setServerError(null);

    // Enforce at least one action if creating
    if (!isEditing && data.actions.length === 0 && customActionsList.length === 0) {
      const errStr = "Please select at least one action or add a custom action.";
      setServerError(errStr);
      toast.error(errStr);
      return;
    }

    try {
      if (isEditing && initialData) {
        const response = await permissionApi.updateGroup(initialData.id, {
          name: data.name,
          description: data.description,
        });

        // Add additional actions if selected
        if (data.actions.length > 0 || customActionsList.length > 0) {
          await permissionApi.addActions(initialData.id, {
            actions: data.actions,
            customActions: customActionsList,
          });
        }

        if (response.success) {
          toast.success("Permission group updated successfully");
          onSuccess();
        }
      } else {
        const response = await permissionApi.createGroup({
          ...data,
          customActions: customActionsList,
        });

        if (response.success) {
          toast.success("Permission group created successfully");
          onSuccess();
        } else {
          setServerError(response.message || "Failed to create permission group");
          toast.error(response.message || "Failed to create permission group");
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {serverError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {serverError}
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Group / Module Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Product, Order, Inventory"
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500"
                />
              </FormControl>
              <FormDescription className="text-xs text-slate-500">
                This forms the permission prefix e.g. "product:create"
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Brief explanation of this permission group"
                  className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 resize-none h-20"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actions"
          render={({ field }) => (
            <FormItem>
              <div className="mb-2">
                <FormLabel className="text-slate-200 font-semibold">Standard Actions</FormLabel>
                <FormDescription className="text-xs text-slate-500">
                  {isEditing
                    ? "Check any additional standard actions you want to grant"
                    : "Select actions to generate for this group"}
                </FormDescription>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                {STANDARD_ACTIONS.map((action) => {
                  const isChecked = field.value?.includes(action);
                  return (
                    <label
                      key={action}
                      className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer hover:text-white"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          const current = field.value || [];
                          if (checked) {
                            field.onChange([...current, action]);
                          } else {
                            field.onChange(current.filter((a) => a !== action));
                          }
                        }}
                        className="border-slate-700 data-[state=checked]:bg-blue-600"
                      />
                      <span>:{action}</span>
                    </label>
                  );
                })}
              </div>
            </FormItem>
          )}
        />

        {/* Custom Actions Input */}
        <div className="space-y-2">
          <FormLabel className="text-slate-200 font-semibold">Custom Actions</FormLabel>
          <FormDescription className="text-xs text-slate-500">
            Add custom non-standard actions (e.g. "export", "archive")
          </FormDescription>

          <div className="flex items-center gap-2">
            <Input
              value={customActionInput}
              onChange={(e) => setCustomActionInput(e.target.value)}
              placeholder="e.g. bulk-export"
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomAction();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomAction}
              className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>

          {customActionsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {customActionsList.map((action) => (
                <Badge
                  key={action}
                  variant="secondary"
                  className="bg-slate-800 border border-slate-700 text-slate-300 gap-1 text-xs px-2 py-0.5"
                >
                  <span>:{action}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomAction(action)}
                    className="text-slate-400 hover:text-red-400 ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
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
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Update Group"
            ) : (
              "Create Group"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

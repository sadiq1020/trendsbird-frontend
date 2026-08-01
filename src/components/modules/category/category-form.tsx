"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Folder, Image as ImageIcon, Layers } from "lucide-react";

import { createCategorySchema, updateCategorySchema, CreateCategoryInput, UpdateCategoryInput } from "@/lib/schemas/category.schema";
import { categoryApi } from "@/lib/api/category";
import { Category, CategoryTreeNode, Media } from "@/types";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/shared/media-picker";

interface CategoryFormProps {
  initialData?: Category | null;
  defaultParentId?: string | null;
  treeNodes?: CategoryTreeNode[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({
  initialData,
  defaultParentId = null,
  treeNodes = [],
  onSuccess,
  onCancel,
}: CategoryFormProps) {
  const isEditing = !!initialData;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Helper to collect all descendant IDs of a category node to prevent cycle selection
  const getForbiddenIds = (targetId: string, nodes: CategoryTreeNode[]): Set<string> => {
    const forbidden = new Set<string>([targetId]);

    const collectChildren = (items: CategoryTreeNode[]) => {
      for (const item of items) {
        if (item.id === targetId || forbidden.has(item.parentId || "")) {
          forbidden.add(item.id);
        }
        if (item.children && item.children.length > 0) {
          collectChildren(item.children);
        }
      }
    };

    collectChildren(nodes);
    return forbidden;
  };

  const forbiddenParentIds = isEditing && initialData ? getForbiddenIds(initialData.id, treeNodes) : new Set<string>();

  // Flatten tree for select dropdown
  const flattenTreeOptions = (
    nodes: CategoryTreeNode[],
    prefix = ""
  ): Array<{ id: string; label: string; disabled: boolean }> => {
    let options: Array<{ id: string; label: string; disabled: boolean }> = [];
    for (const node of nodes) {
      const isDisabled = forbiddenParentIds.has(node.id);
      options.push({
        id: node.id,
        label: `${prefix}${node.name}`,
        disabled: isDisabled,
      });
      if (node.children && node.children.length > 0) {
        options = options.concat(flattenTreeOptions(node.children, `${prefix}— `));
      }
    }
    return options;
  };

  const parentOptions = flattenTreeOptions(treeNodes);

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateCategorySchema : createCategorySchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      parentId: initialData?.parentId || defaultParentId || "",
      image: initialData?.image || "",
      active: initialData?.active ?? true,
      sortOrder: initialData?.sortOrder ?? 0,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedImage = form.watch("image");

  const onSubmit = async (values: any) => {
    setServerError(null);

    const payload: CreateCategoryInput = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      parentId: values.parentId && values.parentId !== "NONE" ? values.parentId : null,
      image: values.image || undefined,
      active: values.active,
      sortOrder: Number(values.sortOrder) || 0,
    };

    try {
      if (isEditing && initialData) {
        const res = await categoryApi.updateCategory(initialData.id, payload as UpdateCategoryInput);
        if (res.success) {
          toast.success("Category updated successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to update category");
        }
      } else {
        const res = await categoryApi.createCategory(payload);
        if (res.success) {
          toast.success("Category created successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to create category");
        }
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Operation failed";
      setServerError(msg);
      toast.error(msg);
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Category Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Footwear &amp; Sneakers"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Custom Slug (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. footwear-sneakers (auto-derived if blank)"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="parentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Parent Category</FormLabel>
                <Select
                  value={field.value || "NONE"}
                  onValueChange={(val) => field.onChange(val === "NONE" ? "" : val)}
                >
                  <FormControl>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                      <SelectValue placeholder="Select parent category..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="NONE">None (Top-level Root Category)</SelectItem>
                    {parentOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id} disabled={opt.disabled}>
                        {opt.label} {opt.disabled ? "(Cycle Guard)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-[11px] text-slate-400">
                  Selecting a parent nests this category under it in the tree hierarchy.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sortOrder"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Display Sort Order</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="0"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-slate-400">
                  Lower values display earlier in category listings.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Category Image MediaPicker Attachment */}
        <div className="space-y-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <FormLabel className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-purple-400" />
              Category Image Banner
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMediaPickerOpen(true)}
              className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-7 gap-1"
            >
              <Folder className="w-3.5 h-3.5" />
              {selectedImage ? "Change Image" : "Choose Asset"}
            </Button>
          </div>

          {selectedImage ? (
            <div className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded-lg">
              <img
                src={selectedImage}
                alt="Category Thumbnail"
                className="w-12 h-12 object-cover rounded border border-slate-800"
              />
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-mono text-slate-300 block truncate">{selectedImage}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.setValue("image", "")}
                className="text-xs text-red-400 hover:bg-red-500/10 h-7"
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              No category image attached. Click "Choose Asset" to select from media library.
            </p>
          )}
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
                  rows={2}
                  placeholder="Optional summary description for this category..."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div>
                <FormLabel className="text-slate-200 font-semibold text-xs">Category Visibility</FormLabel>
                <FormDescription className="text-[11px] text-slate-400">
                  {field.value ? "Active and visible in catalog" : "Hidden from active store front"}
                </FormDescription>
              </div>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className="data-[state=checked]:bg-emerald-600"
              />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Category...
              </>
            ) : isEditing ? (
              "Update Category"
            ) : (
              "Create Category"
            )}
          </Button>
        </div>

        {/* Integrated MediaPicker */}
        <MediaPicker
          open={isMediaPickerOpen}
          onOpenChange={setIsMediaPickerOpen}
          multiple={false}
          onSelect={(selected: Media[]) => {
            if (selected.length > 0) {
              form.setValue("image", selected[0].publicUrl);
            }
          }}
          title="Select Category Image Banner"
        />
      </form>
    </Form>
  );
}

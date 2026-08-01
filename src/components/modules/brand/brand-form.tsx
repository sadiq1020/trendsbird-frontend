"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Image as ImageIcon, Folder } from "lucide-react";

import { createBrandSchema, updateBrandSchema, CreateBrandInput, UpdateBrandInput } from "@/lib/schemas/brand.schema";
import { brandApi } from "@/lib/api/brand";
import { Brand, Media } from "@/types";

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
import { MediaPicker } from "@/components/shared/media-picker";

interface BrandFormProps {
  initialData?: Brand | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BrandForm({ initialData, onSuccess, onCancel }: BrandFormProps) {
  const isEditing = !!initialData;
  const [serverError, setServerError] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateBrandSchema : createBrandSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      logo: initialData?.logo || "",
      status: initialData?.status ?? true,
    },
  });

  const isSubmitting = form.formState.isSubmitting;
  const selectedLogo = form.watch("logo");

  const onSubmit = async (values: any) => {
    setServerError(null);

    const payload: CreateBrandInput = {
      name: values.name,
      slug: values.slug || undefined,
      description: values.description || undefined,
      logo: values.logo || undefined,
      status: values.status,
    };

    try {
      if (isEditing && initialData) {
        const res = await brandApi.updateBrand(initialData.id, payload as UpdateBrandInput);
        if (res.success) {
          toast.success("Brand updated successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to update brand");
        }
      } else {
        const res = await brandApi.createBrand(payload);
        if (res.success) {
          toast.success("Brand created successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to create brand");
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
                <FormLabel className="text-slate-200">Brand Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Nike, Adidas, Sony"
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
                    placeholder="e.g. nike-official (auto-derived if blank)"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Brand Logo Attachment via MediaPicker */}
        <div className="space-y-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between">
            <FormLabel className="text-slate-200 font-semibold text-xs flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              Brand Logo
            </FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMediaPickerOpen(true)}
              className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-7 gap-1"
            >
              <Folder className="w-3.5 h-3.5" />
              {selectedLogo ? "Change Logo" : "Choose Asset"}
            </Button>
          </div>

          {selectedLogo ? (
            <div className="flex items-center gap-3 p-2 bg-slate-900 border border-slate-800 rounded-lg">
              <img
                src={selectedLogo}
                alt="Brand Logo Preview"
                className="w-12 h-12 object-contain rounded border border-slate-800 bg-slate-950"
              />
              <div className="min-w-0 flex-1 text-xs">
                <span className="font-mono text-slate-300 block truncate">{selectedLogo}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.setValue("logo", "")}
                className="text-xs text-red-400 hover:bg-red-500/10 h-7"
              >
                Remove
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500">
              No brand logo attached. Click "Choose Asset" to select from media library.
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
                  placeholder="Optional brand history or manufacturer details..."
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
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
            <FormItem className="flex flex-row items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
              <div>
                <FormLabel className="text-slate-200 font-semibold text-xs">Brand Status</FormLabel>
                <FormDescription className="text-[11px] text-slate-400">
                  {field.value ? "Active and selectable for products" : "Inactive / Suspended"}
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
                Saving Brand...
              </>
            ) : isEditing ? (
              "Update Brand"
            ) : (
              "Create Brand"
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
              form.setValue("logo", selected[0].publicUrl);
            }
          }}
          title="Select Brand Logo Asset"
        />
      </form>
    </Form>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Palette, ListFilter, CheckSquare, Image as ImageIcon, CircleDot } from "lucide-react";

import { createAttributeSchema, updateAttributeSchema, CreateAttributeInput, UpdateAttributeInput } from "@/lib/schemas/attribute.schema";
import { attributeApi } from "@/lib/api/attribute";
import { Attribute, AttributeType } from "@/types";

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

interface AttributeFormProps {
  initialData?: Attribute | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AttributeForm({ initialData, onSuccess, onCancel }: AttributeFormProps) {
  const isEditing = !!initialData;
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateAttributeSchema : createAttributeSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      type: initialData?.type || "DROPDOWN",
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: any) => {
    setServerError(null);

    try {
      if (isEditing && initialData) {
        const updatePayload: UpdateAttributeInput = {
          name: values.name,
          slug: values.slug || undefined,
          type: values.type as AttributeType,
        };
        const res = await attributeApi.updateAttribute(initialData.id, updatePayload);
        if (res.success) {
          toast.success("Attribute updated successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to update attribute");
        }
      } else {
        const createPayload: CreateAttributeInput = {
          name: values.name,
          slug: values.slug || undefined,
          type: values.type as AttributeType,
          values: [],
        };
        const res = await attributeApi.createAttribute(createPayload);
        if (res.success) {
          toast.success("Attribute created successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to create attribute");
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

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200">Attribute Name *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Color, Size, Material, Storage Capacity"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </FormControl>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Custom Slug (Optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. color (auto-derived if blank)"
                    className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200">Attribute Display Type *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                      <SelectValue placeholder="Select display type..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <SelectItem value="DROPDOWN">
                      <div className="flex items-center gap-2">
                        <ListFilter className="w-3.5 h-3.5 text-blue-400" />
                        <span>Dropdown Select</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="RADIO">
                      <div className="flex items-center gap-2">
                        <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Radio Buttons</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CHECKBOX">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
                        <span>Checkboxes</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="COLOR_SWATCH">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-pink-400" />
                        <span>Colour Swatch (Hex Picker)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="IMAGE_SWATCH">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Image Swatch (Media Picker)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-[11px] text-slate-400">
                  Controls how variants appear in product forms &amp; customer storefront.
                </FormDescription>
                <FormMessage className="text-red-400" />
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
                Saving Attribute...
              </>
            ) : isEditing ? (
              "Update Attribute"
            ) : (
              "Create Attribute"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

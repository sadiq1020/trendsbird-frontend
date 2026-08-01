"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ShieldAlert,
  Package,
  Tag,
  Layers,
  Image as ImageIcon,
  Sliders,
  DollarSign,
  Info,
} from "lucide-react";

import {
  createProductSchema,
  CreateProductInput,
  UpdateProductInput,
} from "@/lib/schemas/product.schema";
import { productApi } from "@/lib/api/product";
import { brandApi } from "@/lib/api/brand";
import { categoryApi } from "@/lib/api/category";
import { Product, Brand, CategoryTreeNode } from "@/types";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductFormProps {
  initialData?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ initialData, onSuccess, onCancel }: ProductFormProps) {
  const isEditing = !!initialData;
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Fetch Brands & Category Tree
  const { data: brandsRes } = useQuery({
    queryKey: ["active-brands"],
    queryFn: () => brandApi.listBrands({ limit: 100, status: true }),
  });
  const brands: Brand[] = brandsRes?.data || [];

  const { data: categoryTreeRes } = useQuery({
    queryKey: ["category-tree-select"],
    queryFn: () => categoryApi.getCategoryTree(),
  });
  const categoryTree: CategoryTreeNode[] = categoryTreeRes?.data || [];

  const form = useForm<any>({
    resolver: zodResolver(createProductSchema as any),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      shortDescription: initialData?.shortDescription || "",
      longDescription: initialData?.longDescription || "",
      brandId: initialData?.brandId || "",
      categoryIds: initialData?.categories ? initialData.categories.map((c) => c.id) : [],
      weight: initialData?.weight ?? 0,
      active: initialData?.active ?? true,
      featured: initialData?.featured ?? false,
      sortOrder: initialData?.sortOrder ?? 0,
      hasVariants: initialData?.hasVariants ?? false,
      sku: initialData?.sku || "",
      price: initialData?.price ?? 0,
      salePrice: initialData?.salePrice ?? null,
      stock: initialData?.stock ?? 0,
      variants: initialData?.variants || [],
      media: [],
    },
  });

  const hasVariants = form.watch("hasVariants");
  const selectedCategoryIds: string[] = form.watch("categoryIds") || [];
  const isSubmitting = form.formState.isSubmitting;

  const handleCategoryToggle = (catId: string, checked: boolean) => {
    const current = new Set(selectedCategoryIds);
    if (checked) {
      current.add(catId);
    } else {
      current.delete(catId);
    }
    form.setValue("categoryIds", Array.from(current));
  };

  const onSubmit = async (values: any) => {
    setServerError(null);

    try {
      if (isEditing && initialData) {
        const updatePayload: UpdateProductInput = {
          name: values.name,
          slug: values.slug || undefined,
          shortDescription: values.shortDescription || undefined,
          longDescription: values.longDescription || undefined,
          brandId: values.brandId && values.brandId !== "NONE" ? values.brandId : null,
          categoryIds: values.categoryIds,
          active: values.active,
          featured: values.featured,
          sortOrder: Number(values.sortOrder) || 0,
          weight: Number(values.weight) || 0,
        };

        if (!hasVariants) {
          updatePayload.sku = values.sku;
          updatePayload.price = Number(values.price) || 0;
          updatePayload.salePrice = values.salePrice ? Number(values.salePrice) : null;
          updatePayload.stock = Number(values.stock) || 0;
        }

        const res = await productApi.updateProduct(initialData.id, updatePayload);
        if (res.success) {
          toast.success("Product updated successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to update product");
        }
      } else {
        let createPayload: CreateProductInput;

        if (hasVariants) {
          createPayload = {
            name: values.name,
            slug: values.slug || undefined,
            shortDescription: values.shortDescription || undefined,
            longDescription: values.longDescription || undefined,
            brandId: values.brandId && values.brandId !== "NONE" ? values.brandId : null,
            categoryIds: values.categoryIds,
            weight: Number(values.weight) || 0,
            active: values.active,
            featured: values.featured,
            sortOrder: Number(values.sortOrder) || 0,
            hasVariants: true,
            variants: values.variants && values.variants.length > 0 ? values.variants : [],
            media: [],
          };
        } else {
          createPayload = {
            name: values.name,
            slug: values.slug || undefined,
            shortDescription: values.shortDescription || undefined,
            longDescription: values.longDescription || undefined,
            brandId: values.brandId && values.brandId !== "NONE" ? values.brandId : null,
            categoryIds: values.categoryIds,
            weight: Number(values.weight) || 0,
            active: values.active,
            featured: values.featured,
            sortOrder: Number(values.sortOrder) || 0,
            hasVariants: false,
            sku: values.sku,
            price: Number(values.price) || 0,
            salePrice: values.salePrice ? Number(values.salePrice) : null,
            stock: Number(values.stock) || 0,
            media: [],
          };
        }

        const res = await productApi.createProduct(createPayload);
        if (res.success) {
          toast.success("Product created successfully");
          onSuccess();
        } else {
          setServerError(res.message || "Failed to create product");
        }
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Operation failed";
      setServerError(msg);
      toast.error(msg);
    }
  };

  const renderCategoryCheckboxTree = (nodes: CategoryTreeNode[], level = 0) => {
    return (
      <div className="space-y-1.5">
        {nodes.map((node) => {
          const isChecked = selectedCategoryIds.includes(node.id);
          return (
            <div key={node.id} className="space-y-1">
              <div
                style={{ paddingLeft: `${level * 20}px` }}
                className="flex items-center gap-2 py-1 px-2 hover:bg-slate-800/50 rounded-lg text-xs"
              >
                <Checkbox
                  id={`cat-${node.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleCategoryToggle(node.id, !!checked)}
                  className="data-[state=checked]:bg-blue-600 border-slate-700"
                />
                <label
                  htmlFor={`cat-${node.id}`}
                  className="text-slate-200 cursor-pointer flex-1 font-medium"
                >
                  {node.name}
                  <span className="text-[10px] text-slate-400 font-mono ml-2">/{node.slug}</span>
                </label>
              </div>

              {node.children && node.children.length > 0 && (
                <div>{renderCategoryCheckboxTree(node.children, level + 1)}</div>
              )}
            </div>
          );
        })}
      </div>
    );
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

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-950 border border-slate-800 text-slate-400 w-full justify-start">
            <TabsTrigger value="details" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5">
              <Package className="w-3.5 h-3.5 text-blue-400" />
              <span>1. General Details</span>
            </TabsTrigger>
            <TabsTrigger value="taxonomy" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              <span>2. Brand &amp; Categories ({selectedCategoryIds.length})</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>3. Media Assets</span>
            </TabsTrigger>
            <TabsTrigger value="variants" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span>4. Variants &amp; Inventory</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: General Details */}
          <TabsContent value="details" className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Ultra Light Running Shoes"
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
                        placeholder="ultra-light-running-shoes"
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200">Short Summary Description</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Brief one-line summary for product cards..."
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="longDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200">Full Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Detailed features, materials, and specification details..."
                      className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            {/* Product Configuration Mode Toggle (Simple vs Variable) */}
            <FormField
              control={form.control}
              name="hasVariants"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                  <div>
                    <FormLabel className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-pink-400" />
                      <span>Product Variant Matrix Mode</span>
                    </FormLabel>
                    <FormDescription className="text-[11px] text-slate-400">
                      {field.value
                        ? "VARIABLE PRODUCT: Prices, SKU, & Stock defined per variant option (Color/Size)"
                        : "SIMPLE PRODUCT: Single standalone product with fixed price & inventory"}
                    </FormDescription>
                  </div>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isEditing}
                    className="data-[state=checked]:bg-pink-600"
                  />
                </FormItem>
              )}
            />

            {/* Simple Product Fields (SKU, Price, Sale Price, Stock) */}
            {!hasVariants ? (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Simple Product Pricing &amp; Stock</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">SKU Code *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. SHOE-RUN-001"
                            className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Stock Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="50"
                            className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
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
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Regular Price ($) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="99.99"
                            className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-200">Sale Price ($) (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="79.99 (Must be <= Regular Price)"
                            className="bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 text-xs flex items-center gap-3">
                <Info className="w-5 h-5 text-purple-400 shrink-0" />
                <span>
                  <strong>Variable Product Mode Active:</strong> Individual SKUs, regular prices, sale prices, and stock inventory will be configured under the <strong>Variants &amp; Inventory</strong> tab.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">Weight (kg)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder="0.5"
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
                  <FormItem className="flex flex-row items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg mt-1">
                    <FormLabel className="text-slate-200 font-semibold text-xs">Active Status</FormLabel>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg mt-1">
                    <FormLabel className="text-slate-200 font-semibold text-xs">Featured</FormLabel>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-amber-600"
                    />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          {/* TAB 2: Brand & Categories */}
          <TabsContent value="taxonomy" className="pt-4 space-y-4">
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-blue-400" />
                    <span>Manufacturer Brand</span>
                  </FormLabel>
                  <Select
                    value={field.value || "NONE"}
                    onValueChange={(val) => field.onChange(val === "NONE" ? "" : val)}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                        <SelectValue placeholder="Select a brand..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                      <SelectItem value="NONE">No Brand (Unbranded)</SelectItem>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="space-y-2 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <FormLabel className="text-slate-200 font-bold text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Assign Categories (Multi-select)</span>
                </span>
                <span className="text-[11px] text-blue-400 font-normal">
                  {selectedCategoryIds.length} category(ies) selected
                </span>
              </FormLabel>

              <div className="max-h-64 overflow-y-auto p-2 bg-slate-900/80 border border-slate-800 rounded-lg">
                {categoryTree.length > 0 ? (
                  renderCategoryCheckboxTree(categoryTree)
                ) : (
                  <p className="text-xs text-slate-500 italic p-3 text-center">
                    No categories created yet. Create categories in the Category module to assign them here.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: Media Assets Placeholder */}
          <TabsContent value="media" className="pt-4 space-y-4">
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">Media Assets &amp; Gallery Attachment</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Primary thumbnail assignment and multi-image gallery ordering will be enabled in Part 2.
              </p>
            </div>
          </TabsContent>

          {/* TAB 4: Variants & Inventory Placeholder */}
          <TabsContent value="variants" className="pt-4 space-y-4">
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-2">
              <Sliders className="w-8 h-8 text-pink-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">Variant Combinations &amp; SKU Matrix</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Automatic variant matrix generator based on attributes will be enabled in Part 2.
              </p>
            </div>
          </TabsContent>
        </Tabs>

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
                Saving Product...
              </>
            ) : isEditing ? (
              "Update Product"
            ) : (
              "Create Product"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

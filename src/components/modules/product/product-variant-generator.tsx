"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Sliders,
  Sparkles,
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Package,
  AlertCircle,
} from "lucide-react";

import { attributeApi } from "@/lib/api/attribute";
import { Attribute, AttributeValue, Media } from "@/types";
import { VariantInput } from "@/lib/schemas/product.schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/shared/media-picker";

interface ProductVariantGeneratorProps {
  productName: string;
  variants: VariantInput[];
  onChange: (variants: VariantInput[]) => void;
}

export function ProductVariantGenerator({
  productName,
  variants,
  onChange,
}: ProductVariantGeneratorProps) {
  // Selected attribute IDs and value IDs map
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [selectedValueMap, setSelectedValueMap] = useState<Record<string, string[]>>({});

  // MediaPicker target state for per-variant media
  const [activePickerVariantIdx, setActivePickerVariantIdx] = useState<number | null>(null);

  // Fetch attributes
  const { data: attributesRes, isLoading: isAttrLoading } = useQuery({
    queryKey: ["attributes-all"],
    queryFn: () => attributeApi.listAttributes({ limit: 100 }),
  });
  const allAttributes: Attribute[] = attributesRes?.data || [];

  const handleToggleAttribute = (attrId: string, checked: boolean) => {
    if (checked) {
      setSelectedAttrIds((prev) => [...prev, attrId]);
      const attr = allAttributes.find((a) => a.id === attrId);
      if (attr && attr.values) {
        // Default select all values under this attribute
        setSelectedValueMap((prev) => ({
          ...prev,
          [attrId]: attr.values.map((v) => v.id),
        }));
      }
    } else {
      setSelectedAttrIds((prev) => prev.filter((id) => id !== attrId));
      setSelectedValueMap((prev) => {
        const copy = { ...prev };
        delete copy[attrId];
        return copy;
      });
    }
  };

  const handleToggleValue = (attrId: string, valId: string, checked: boolean) => {
    setSelectedValueMap((prev) => {
      const current = new Set(prev[attrId] || []);
      if (checked) {
        current.add(valId);
      } else {
        current.delete(valId);
      }
      return { ...prev, [attrId]: Array.from(current) };
    });
  };

  const generateCartesianCombinations = () => {
    const activeAttrs = allAttributes.filter(
      (a) => selectedAttrIds.includes(a.id) && (selectedValueMap[a.id] || []).length > 0
    );

    if (activeAttrs.length === 0) {
      toast.error("Select at least one attribute and value to generate combinations");
      return;
    }

    const arraysToCombine: Array<Array<{ attr: Attribute; val: AttributeValue }>> = activeAttrs.map(
      (attr) => {
        const chosenValIds = selectedValueMap[attr.id] || [];
        return attr.values
          .filter((v) => chosenValIds.includes(v.id))
          .map((val) => ({ attr, val }));
      }
    );

    // Cartesian product algorithm
    const cartesian = (args: Array<Array<{ attr: Attribute; val: AttributeValue }>>) => {
      const r: Array<Array<{ attr: Attribute; val: AttributeValue }>> = [];
      const max = args.length - 1;
      function helper(arr: Array<{ attr: Attribute; val: AttributeValue }>, i: number) {
        for (let j = 0, l = args[i].length; j < l; j++) {
          const a = arr.slice(0);
          a.push(args[i][j]);
          if (i === max) r.push(a);
          else helper(a, i + 1);
        }
      }
      helper([], 0);
      return r;
    };

    const combinations = cartesian(arraysToCombine);

    const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const baseSku = slugify(productName || "PROD").toUpperCase();

    const generatedVariants: VariantInput[] = combinations.map((combo, idx) => {
      const comboSkuSuffix = combo.map((c) => slugify(c.val.value).toUpperCase()).join("-");
      const sku = `${baseSku}-${comboSkuSuffix}`;
      const attrValIds = combo.map((c) => c.val.id);

      return {
        sku,
        price: 0,
        salePrice: null,
        stock: 10,
        lowStockThreshold: 2,
        weight: 0,
        active: true,
        attributeValueIds: attrValIds,
        media: [],
      };
    });

    // Check duplicate combinations against existing
    onChange(generatedVariants);
    toast.success(`Generated ${generatedVariants.length} variant combination(s)`);
  };

  const handleUpdateVariantField = (idx: number, field: keyof VariantInput, value: any) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const handleRemoveVariant = (idx: number) => {
    const updated = variants.filter((_, i) => i !== idx);
    onChange(updated);
  };

  // Helper to format combination badges for a variant row
  const getCombinationLabels = (attrValueIds: string[]) => {
    const labels: Array<{ attrName: string; valName: string; refVal?: string | null }> = [];
    for (const attr of allAttributes) {
      if (attr.values) {
        for (const v of attr.values) {
          if (attrValueIds.includes(v.id)) {
            labels.push({ attrName: attr.name, valName: v.value, refVal: v.referenceValue });
          }
        }
      }
    }
    return labels;
  };

  return (
    <div className="space-y-6">
      {/* 1. Attribute & Value Selector */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-pink-400" />
              <span>Step 1: Select Variant Attributes &amp; Values</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pick attributes (Color, Size) to generate product variant matrix.
            </p>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={generateCartesianCombinations}
            disabled={selectedAttrIds.length === 0}
            className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold gap-1.5 h-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Combinations</span>
          </Button>
        </div>

        {isAttrLoading ? (
          <div className="p-6 text-center text-xs text-slate-400">Loading attributes...</div>
        ) : allAttributes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allAttributes.map((attr) => {
              const isAttrSelected = selectedAttrIds.includes(attr.id);
              const selectedValues = selectedValueMap[attr.id] || [];

              return (
                <div
                  key={attr.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isAttrSelected
                      ? "bg-slate-950 border-pink-500/40"
                      : "bg-slate-950/40 border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`attr-${attr.id}`}
                        checked={isAttrSelected}
                        onCheckedChange={(checked) =>
                          handleToggleAttribute(attr.id, !!checked)
                        }
                        className="data-[state=checked]:bg-pink-600 border-slate-700"
                      />
                      <label
                        htmlFor={`attr-${attr.id}`}
                        className="text-xs font-bold text-slate-200 cursor-pointer"
                      >
                        {attr.name}
                      </label>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-slate-900 border-slate-800 text-slate-400 font-mono">
                      {attr.type}
                    </Badge>
                  </div>

                  {isAttrSelected && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {attr.values && attr.values.length > 0 ? (
                        attr.values.map((val) => {
                          const isValSelected = selectedValues.includes(val.id);
                          return (
                            <label
                              key={val.id}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isValSelected
                                  ? "bg-pink-500/10 border-pink-500/40 text-pink-300"
                                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              <Checkbox
                                checked={isValSelected}
                                onCheckedChange={(checked) =>
                                  handleToggleValue(attr.id, val.id, !!checked)
                                }
                                className="data-[state=checked]:bg-pink-600 border-slate-700 w-3.5 h-3.5"
                              />
                              {attr.type === "COLOR_SWATCH" && val.referenceValue && (
                                <span
                                  className="w-3 h-3 rounded-full border border-slate-700 inline-block"
                                  style={{ backgroundColor: val.referenceValue }}
                                />
                              )}
                              <span>{val.value}</span>
                            </label>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">
                          No values defined under {attr.name}.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-3 text-center">
            No attributes defined. Create attributes in the Attribute module first.
          </p>
        )}
      </div>

      {/* 2. Editable Variant Matrix Table */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-purple-400" />
              <span>Step 2: Variant Matrix Table ({variants.length})</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Configure per-variant SKU, prices, stock, and media attachments.
            </p>
          </div>
        </div>

        {variants.length > 0 ? (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {variants.map((v, idx) => {
              const labels = getCombinationLabels(v.attributeValueIds);
              const isSaleError = v.salePrice !== null && v.salePrice !== undefined && v.salePrice > v.price;

              return (
                <div
                  key={idx}
                  className={`p-3 bg-slate-950 border rounded-xl space-y-3 transition-all ${
                    isSaleError ? "border-red-500/50 bg-red-500/5" : "border-slate-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 font-mono">#{idx + 1}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {labels.map((l, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-slate-900 border-slate-800 text-slate-200 text-xs gap-1"
                          >
                            <span className="text-slate-400">{l.attrName}:</span>
                            <span className="font-semibold">{l.valName}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span>Active</span>
                        <Switch
                          checked={v.active}
                          onCheckedChange={(checked) =>
                            handleUpdateVariantField(idx, "active", checked)
                          }
                          className="data-[state=checked]:bg-emerald-600 scale-75"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveVariant(idx)}
                        className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Variant SKU *
                      </label>
                      <Input
                        value={v.sku}
                        onChange={(e) =>
                          handleUpdateVariantField(idx, "sku", e.target.value)
                        }
                        placeholder="SKU-001"
                        className="bg-slate-900 border-slate-800 text-slate-100 text-xs font-mono h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Regular Price ($) *
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={v.price}
                        onChange={(e) =>
                          handleUpdateVariantField(idx, "price", Number(e.target.value) || 0)
                        }
                        placeholder="49.99"
                        className="bg-slate-900 border-slate-800 text-slate-100 text-xs font-mono h-8"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Sale Price ($)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={v.salePrice ?? ""}
                        onChange={(e) =>
                          handleUpdateVariantField(
                            idx,
                            "salePrice",
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        placeholder="39.99"
                        className={`bg-slate-900 text-slate-100 text-xs font-mono h-8 ${
                          isSaleError ? "border-red-500 text-red-300" : "border-slate-800"
                        }`}
                      />
                      {isSaleError && (
                        <span className="text-[10px] text-red-400 block mt-0.5 font-medium">
                          Sale price cannot exceed regular price
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Stock Quantity *
                      </label>
                      <Input
                        type="number"
                        value={v.stock}
                        onChange={(e) =>
                          handleUpdateVariantField(idx, "stock", Number(e.target.value) || 0)
                        }
                        placeholder="10"
                        className="bg-slate-900 border-slate-800 text-slate-100 text-xs font-mono h-8"
                      />
                    </div>
                  </div>

                  {/* Row Level Media Attachment */}
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Variant Media:{" "}
                      <span className="font-semibold text-blue-400">
                        {v.media?.length || 0} attached
                      </span>
                    </span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActivePickerVariantIdx(idx)}
                      className="border-slate-800 bg-slate-900 text-slate-300 text-[11px] h-7 gap-1"
                    >
                      <ImageIcon className="w-3 h-3 text-amber-400" />
                      <span>Attach Variant Media</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
            <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No variant combinations generated yet.</p>
            <p className="text-[11px] text-slate-500">
              Select attributes above and click "Generate Combinations".
            </p>
          </div>
        )}
      </div>

      {/* Per-Variant MediaPicker */}
      {activePickerVariantIdx !== null && (
        <MediaPicker
          open={activePickerVariantIdx !== null}
          onOpenChange={(open) => !open && setActivePickerVariantIdx(null)}
          multiple={true}
          selectedIds={variants[activePickerVariantIdx]?.media?.map((m) => m.mediaId) || []}
          onSelect={(selectedMedia: Media[]) => {
            if (activePickerVariantIdx !== null) {
              const currentMedia = variants[activePickerVariantIdx]?.media || [];
              const existingIds = new Set(currentMedia.map((m) => m.mediaId));
              const newAttachments = selectedMedia
                .filter((m) => !existingIds.has(m.id))
                .map((m, i) => ({
                  mediaId: m.id,
                  isThumbnail: i === 0 && currentMedia.length === 0,
                  isGallery: true,
                  sortOrder: currentMedia.length + i,
                }));

              handleUpdateVariantField(
                activePickerVariantIdx,
                "media",
                [...currentMedia, ...newAttachments]
              );
              setActivePickerVariantIdx(null);
            }
          }}
          title="Select Variant Specific Media"
        />
      )}
    </div>
  );
}

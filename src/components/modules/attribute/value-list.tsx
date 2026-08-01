"use client";

import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Palette, Image as ImageIcon, Check, Loader2, Package, Sparkles } from "lucide-react";

import { attributeApi } from "@/lib/api/attribute";
import { Attribute, AttributeValue, AttributeType, Media } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { MediaPicker } from "@/components/shared/media-picker";
import { Can } from "@/components/shared/can";

interface ValueListProps {
  attribute: Attribute;
  onRefresh: () => void;
}

export function ValueList({ attribute, onRefresh }: ValueListProps) {
  const [newValue, setNewValue] = useState("");
  const [newRefValue, setNewRefValue] = useState("#3B82F6");
  const [isAdding, setIsAdding] = useState(false);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Edit Value State
  const [editingValue, setEditingValue] = useState<AttributeValue | null>(null);
  const [editValName, setEditValName] = useState("");
  const [editRefVal, setEditRefVal] = useState("");
  const [isEditingMediaPickerOpen, setIsEditingMediaPickerOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Value State
  const [deletingValue, setDeletingValue] = useState<AttributeValue | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const type = attribute.type;

  const handleAddValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) {
      toast.error("Value name cannot be empty");
      return;
    }

    // Client-side uniqueness check
    const exists = attribute.values.some(
      (v) => v.value.toLowerCase() === newValue.trim().toLowerCase()
    );
    if (exists) {
      toast.error(`Value "${newValue}" already exists under this attribute`);
      return;
    }

    setIsAdding(true);
    try {
      const refVal =
        type === "COLOR_SWATCH" || type === "IMAGE_SWATCH" ? newRefValue : undefined;

      const res = await attributeApi.addValues(attribute.id, [
        {
          value: newValue.trim(),
          referenceValue: refVal,
        },
      ]);

      if (res.success) {
        toast.success(`Value "${newValue}" added to ${attribute.name}`);
        setNewValue("");
        if (type === "COLOR_SWATCH") setNewRefValue("#3B82F6");
        if (type === "IMAGE_SWATCH") setNewRefValue("");
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add value");
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenEdit = (valItem: AttributeValue) => {
    setEditingValue(valItem);
    setEditValName(valItem.value);
    setEditRefVal(valItem.referenceValue || (type === "COLOR_SWATCH" ? "#3B82F6" : ""));
  };

  const handleUpdateValue = async () => {
    if (!editingValue || !editValName.trim()) return;

    // Check duplicate
    const isDuplicate = attribute.values.some(
      (v) => v.id !== editingValue.id && v.value.toLowerCase() === editValName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error(`Value "${editValName}" already exists under this attribute`);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await attributeApi.updateValue(attribute.id, editingValue.id, {
        value: editValName.trim(),
        referenceValue: type === "COLOR_SWATCH" || type === "IMAGE_SWATCH" ? editRefVal : undefined,
      });

      if (res.success) {
        toast.success("Attribute value updated");
        setEditingValue(null);
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update value");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteValue = async () => {
    if (!deletingValue) return;
    setIsDeleting(true);
    setDeletingError(null);

    try {
      const res = await attributeApi.deleteValue(attribute.id, deletingValue.id);
      if (res.success) {
        toast.success(`Value "${deletingValue.value}" deleted`);
        setDeletingValue(null);
        onRefresh();
      } else {
        setDeletingError(res.message || "Failed to delete value");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to delete value";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* List of Current Attribute Values */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Configured Values ({attribute.values.length})</span>
        </h4>

        {attribute.values.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {attribute.values.map((val) => (
              <div
                key={val.id}
                className="flex items-center justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                  {type === "COLOR_SWATCH" && (
                    <div
                      className="w-5 h-5 rounded-full border border-slate-700 shrink-0 shadow-sm"
                      style={{ backgroundColor: val.referenceValue || "#3B82F6" }}
                      title={val.referenceValue || ""}
                    />
                  )}

                  {type === "IMAGE_SWATCH" && val.referenceValue && (
                    <img
                      src={val.referenceValue}
                      alt={val.value}
                      className="w-6 h-6 object-cover rounded border border-slate-800 shrink-0"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-100 block truncate">
                      {val.value}
                    </span>
                    {val.referenceValue && (
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {val.referenceValue}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {val.variantCount !== undefined && val.variantCount > 0 && (
                    <Badge
                      variant="outline"
                      className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] gap-1"
                    >
                      <Package className="w-3 h-3" />
                      <span>{val.variantCount}</span>
                    </Badge>
                  )}

                  <Can I="attribute:update">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(val)}
                      className="text-slate-400 hover:text-slate-100 p-1"
                      title="Edit Value"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </Can>

                  <Can I="attribute:delete">
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingError(null);
                        setDeletingValue(val);
                      }}
                      className="text-slate-500 hover:text-red-400 p-1"
                      title="Delete Value"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Can>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-lg border border-slate-800">
            No values defined yet for this attribute. Add values using the form below.
          </p>
        )}
      </div>

      {/* Inline Form to Add New Value */}
      <Can I="attribute:update">
        <form onSubmit={handleAddValue} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
          <h5 className="text-xs font-semibold text-slate-300">Add New Value</h5>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={
                type === "COLOR_SWATCH"
                  ? "Color Name (e.g. Crimson Red)"
                  : type === "IMAGE_SWATCH"
                  ? "Pattern Name (e.g. Floral Camo)"
                  : "Value Name (e.g. XL, 128GB)"
              }
              className="bg-slate-900 border-slate-800 text-slate-100 text-xs flex-1"
            />

            {type === "COLOR_SWATCH" && (
              <Popover>
                <PopoverTrigger className="inline-flex items-center gap-2 border border-slate-800 bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 hover:bg-slate-800 transition-colors h-9">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: newRefValue }}
                  />
                  <span>{newRefValue}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-slate-900 border-slate-800">
                  <HexColorPicker color={newRefValue} onChange={setNewRefValue} />
                  <Input
                    value={newRefValue}
                    onChange={(e) => setNewRefValue(e.target.value)}
                    className="mt-2 bg-slate-950 border-slate-800 text-slate-100 text-xs font-mono text-center"
                  />
                </PopoverContent>
              </Popover>
            )}

            {type === "IMAGE_SWATCH" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMediaPickerOpen(true)}
                className="border-slate-800 bg-slate-900 text-slate-200 text-xs gap-1.5 shrink-0 h-9"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{newRefValue ? "Image Picked" : "Select Swatch Image"}</span>
              </Button>
            )}

            <Button
              type="submit"
              disabled={isAdding}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold h-9 shrink-0"
            >
              {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span className="ml-1">Add Value</span>
            </Button>
          </div>
        </form>
      </Can>

      {/* Edit Value Modal */}
      {editingValue && (
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h5 className="text-xs font-semibold text-slate-200">Edit Value: {editingValue.value}</h5>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              value={editValName}
              onChange={(e) => setEditValName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs flex-1"
            />

            {type === "COLOR_SWATCH" && (
              <Popover>
                <PopoverTrigger className="inline-flex items-center gap-2 border border-slate-800 bg-slate-950 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 hover:bg-slate-800 transition-colors h-9">
                  <div
                    className="w-4 h-4 rounded-full border border-slate-600"
                    style={{ backgroundColor: editRefVal || "#3B82F6" }}
                  />
                  <span>{editRefVal || "#3B82F6"}</span>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3 bg-slate-900 border-slate-800">
                  <HexColorPicker color={editRefVal || "#3B82F6"} onChange={setEditRefVal} />
                </PopoverContent>
              </Popover>
            )}

            {type === "IMAGE_SWATCH" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingMediaPickerOpen(true)}
                className="border-slate-800 bg-slate-950 text-slate-200 text-xs gap-1.5 shrink-0 h-9"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
                <span>{editRefVal ? "Image Set" : "Choose Image"}</span>
              </Button>
            )}

            <div className="flex items-center gap-1 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingValue(null)}
                className="border-slate-800 bg-slate-950 text-slate-300 text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleUpdateValue}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-9"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Value Confirm Dialog */}
      <ConfirmDialog
        open={!!deletingValue}
        onOpenChange={(open) => !open && setDeletingValue(null)}
        title={`Delete Value: ${deletingValue?.value}`}
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingValue?.value}</strong>?
            Deletion will be blocked if products are using this value in a variant.
          </span>
        }
        confirmText="Delete Value"
        onConfirm={handleDeleteValue}
        isLoading={isDeleting}
        error={deletingError}
      />

      {/* Add MediaPicker */}
      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        multiple={false}
        onSelect={(selected: Media[]) => {
          if (selected.length > 0) {
            setNewRefValue(selected[0].publicUrl);
          }
        }}
        title="Select Image Swatch Asset"
      />

      {/* Edit MediaPicker */}
      <MediaPicker
        open={isEditingMediaPickerOpen}
        onOpenChange={setIsEditingMediaPickerOpen}
        multiple={false}
        onSelect={(selected: Media[]) => {
          if (selected.length > 0) {
            setEditRefVal(selected[0].publicUrl);
          }
        }}
        title="Select Image Swatch Asset"
      />
    </div>
  );
}

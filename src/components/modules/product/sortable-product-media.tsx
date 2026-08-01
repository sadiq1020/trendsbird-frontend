"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/shared/media-picker";
import { Media } from "@/types";
import {
  GripVertical,
  Trash2,
  Star,
  Plus,
  Image as ImageIcon,
  Video,
} from "lucide-react";

export interface FormMediaAttachment {
  id: string; // unique attachment id
  mediaId: string;
  media: Media;
  isThumbnail: boolean;
  isGallery: boolean;
  sortOrder: number;
}

interface SortableMediaItemProps {
  item: FormMediaAttachment;
  onSetThumbnail: (id: string) => void;
  onToggleGallery: (id: string, isGallery: boolean) => void;
  onRemove: (id: string) => void;
}

function SortableMediaItem({
  item,
  onSetThumbnail,
  onToggleGallery,
  onRemove,
}: SortableMediaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isImage = item.media.type === "IMAGE";
  const thumbSrc = item.media.thumbnailUrl || item.media.publicUrl;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-slate-950 border rounded-xl flex items-center justify-between gap-3 text-xs transition-all ${
        isDragging ? "opacity-50 border-blue-500 scale-[0.98] shadow-lg" : "border-slate-800"
      } ${item.isThumbnail ? "ring-1 ring-amber-500/40 bg-amber-500/5" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-200 p-1"
          title="Drag to reorder sort order"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Thumbnail Box */}
        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
          {isImage && thumbSrc ? (
            <img
              src={thumbSrc}
              alt={item.media.title || item.media.fileName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Video className="w-5 h-5 text-purple-400" />
          )}
        </div>

        {/* Media Details */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-100 truncate" title={item.media.fileName}>
              {item.media.title || item.media.fileName}
            </span>
            {item.isThumbnail && (
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[9px] px-1.5 py-0 gap-1 shrink-0">
                <Star className="w-2.5 h-2.5 fill-amber-300" /> THUMBNAIL
              </Badge>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
            <span>Sort Order: #{item.sortOrder}</span>
            <span>•</span>
            <span className="uppercase">{item.media.type}</span>
          </div>
        </div>
      </div>

      {/* Item Controls */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Gallery Toggle */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Gallery</span>
          <Switch
            checked={item.isGallery}
            onCheckedChange={(checked) => onToggleGallery(item.id, checked)}
            className="data-[state=checked]:bg-blue-600 scale-75"
          />
        </div>

        {/* Thumbnail Toggle Button */}
        {!item.isThumbnail && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetThumbnail(item.id)}
            className="border-slate-800 bg-slate-900 text-amber-400 hover:bg-amber-500/10 text-[11px] h-7 gap-1"
          >
            <Star className="w-3 h-3" />
            <span>Set Thumbnail</span>
          </Button>
        )}

        {/* Remove Button */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(item.id)}
          className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
          title="Remove Media"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface SortableProductMediaProps {
  value: FormMediaAttachment[];
  onChange: (attachments: FormMediaAttachment[]) => void;
}

export function SortableProductMedia({ value, onChange }: SortableProductMediaProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = value.findIndex((item) => item.id === active.id);
      const newIndex = value.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(value, oldIndex, newIndex);
      // Recalculate sortOrder index sequentially
      const updated = reordered.map((item, idx) => ({ ...item, sortOrder: idx }));
      onChange(updated);
    }
  };

  const handleSetThumbnail = (attachmentId: string) => {
    // Single thumbnail enforcement: set target to true and all others to false
    const updated = value.map((item) => ({
      ...item,
      isThumbnail: item.id === attachmentId,
    }));
    onChange(updated);
  };

  const handleToggleGallery = (attachmentId: string, isGallery: boolean) => {
    const updated = value.map((item) =>
      item.id === attachmentId ? { ...item, isGallery } : item
    );
    onChange(updated);
  };

  const handleRemove = (attachmentId: string) => {
    const remaining = value.filter((item) => item.id !== attachmentId);
    // If we removed the thumbnail, assign thumbnail to the first remaining item
    if (remaining.length > 0 && !remaining.some((i) => i.isThumbnail)) {
      remaining[0].isThumbnail = true;
    }
    const reindexed = remaining.map((item, idx) => ({ ...item, sortOrder: idx }));
    onChange(reindexed);
  };

  const handleSelectFromPicker = (selectedMedia: Media[]) => {
    const existingMediaIds = new Set(value.map((v) => v.mediaId));
    const newAttachments: FormMediaAttachment[] = [];

    let currentSortOrder = value.length;
    let hasThumbnail = value.some((v) => v.isThumbnail);

    for (const media of selectedMedia) {
      if (!existingMediaIds.has(media.id)) {
        const isThumb = !hasThumbnail && newAttachments.length === 0;
        newAttachments.push({
          id: `attach-${media.id}-${Date.now()}`,
          mediaId: media.id,
          media,
          isThumbnail: isThumb,
          isGallery: true,
          sortOrder: currentSortOrder++,
        });
        if (isThumb) hasThumbnail = true;
      }
    }

    onChange([...value, ...newAttachments]);
  };

  return (
    <div className="space-y-4 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Product Gallery &amp; Main Thumbnail</span>
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Drag items to reorder gallery carousel. Exactly 1 item is enforced as Main Thumbnail.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsMediaPickerOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5 h-8"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Media Assets</span>
        </Button>
      </div>

      {value.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={value.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {value.map((item) => (
                <SortableMediaItem
                  key={item.id}
                  item={item}
                  onSetThumbnail={handleSetThumbnail}
                  onToggleGallery={handleToggleGallery}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40 space-y-2">
          <ImageIcon className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs text-slate-400">No media assets attached to this product.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsMediaPickerOpen(true)}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs h-7"
          >
            Choose from Media Library
          </Button>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        multiple={true}
        selectedIds={value.map((v) => v.mediaId)}
        onSelect={handleSelectFromPicker}
        title="Select Media for Product Gallery"
      />
    </div>
  );
}

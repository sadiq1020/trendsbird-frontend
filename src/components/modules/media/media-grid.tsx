"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import { toast } from "sonner";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  Check,
  Video,
  Image as ImageIcon,
  ExternalLink,
  Eye,
} from "lucide-react";

import { mediaApi } from "@/lib/api/media";
import { usePermission } from "@/lib/hooks/use-permission";
import { Media, MediaType } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormModal } from "@/components/shared/form-modal";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";

interface MediaGridProps {
  selectMode?: boolean;
  multiple?: boolean;
  selectedIds?: string[];
  onSelect?: (media: Media) => void;
  onRefreshTrigger?: number;
}

export function MediaGrid({
  selectMode = false,
  selectedIds = [],
  onSelect,
  onRefreshTrigger = 0,
}: MediaGridProps) {
  const canWrite = usePermission("media:write");
  const canDelete = usePermission("media:delete");

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(12));
  const [search, setSearch] = useQueryState("search", parseAsString.withDefault(""));
  const [typeFilter, setTypeFilter] = useQueryState("type", parseAsString.withDefault("ALL"));

  const [searchInput, setSearchInput] = useState(search);

  // Editing & Deleting states
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAltText, setEditAltText] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingMedia, setDeletingMedia] = useState<Media | null>(null);
  const [deletingError, setDeletingError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview Modal
  const [previewMedia, setPreviewMedia] = useState<Media | null>(null);

  const mediaTypeParam: MediaType | undefined =
    typeFilter === "IMAGE" || typeFilter === "VIDEO" ? (typeFilter as MediaType) : undefined;

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ["media-library", page, limit, search, typeFilter, onRefreshTrigger],
    queryFn: () =>
      mediaApi.listMedia({
        page,
        limit,
        search: search || undefined,
        type: mediaTypeParam,
      }),
  });

  const mediaList: Media[] = response?.data || [];
  const meta = response?.meta || { page: 1, limit: 12, total: 0, totalPages: 1 };
  const totalPages = meta.totalPages || 1;

  const handleEditOpen = (item: Media) => {
    setEditingMedia(item);
    setEditTitle(item.title || "");
    setEditAltText(item.altText || "");
  };

  const handleSaveMeta = async () => {
    if (!editingMedia) return;
    setIsUpdating(true);
    try {
      const res = await mediaApi.updateMediaMeta(editingMedia.id, {
        title: editTitle,
        altText: editAltText,
      });
      if (res.success) {
        toast.success("Media metadata updated successfully");
        setEditingMedia(null);
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update metadata");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (!deletingMedia) return;
    setIsDeleting(true);
    setDeletingError(null);
    try {
      const res = await mediaApi.deleteMedia(deletingMedia.id);
      if (res.success) {
        toast.success("Media asset deleted permanently");
        setDeletingMedia(null);
        refetch();
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to delete media asset";
      setDeletingError(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search files by title or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchInput || null);
                setPage(1);
              }
            }}
            className="pl-9 pr-8 bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput("");
                setSearch(null);
                setPage(1);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Type:</span>
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[130px] bg-slate-950 border-slate-800 text-slate-200 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="IMAGE">Images Only</SelectItem>
              <SelectItem value="VIDEO">Videos Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: limit }).map((_, idx) => (
            <div key={idx} className="border border-slate-800 rounded-xl overflow-hidden p-2 space-y-2">
              <Skeleton className="h-32 w-full bg-slate-800 rounded-lg" />
              <Skeleton className="h-4 w-3/4 bg-slate-800" />
            </div>
          ))}
        </div>
      ) : mediaList.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {mediaList.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isImage = item.type === "IMAGE";
            const thumbnailSrc = item.thumbnailUrl || item.publicUrl;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (selectMode && onSelect) {
                    onSelect(item);
                  }
                }}
                className={`group relative border rounded-xl overflow-hidden transition-all bg-slate-900 ${
                  selectMode ? "cursor-pointer" : ""
                } ${
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/30"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Select Badge */}
                {selectMode && (
                  <div
                    className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? "bg-blue-600 border-blue-400 text-white"
                        : "bg-slate-950/60 border-slate-700 text-transparent group-hover:text-slate-400"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}

                {/* Media Preview Box */}
                <div className="relative h-36 bg-slate-950 flex items-center justify-center overflow-hidden">
                  {isImage && thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={item.altText || item.title || item.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-purple-400">
                      <Video className="w-10 h-10" />
                      <span className="text-[10px] font-mono uppercase bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                        {item.mimeType.split("/")[1] || "VIDEO"}
                      </span>
                    </div>
                  )}

                  {/* Hover Quick Overlay Actions */}
                  {!selectMode && (
                    <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewMedia(item);
                        }}
                        title="Preview Asset"
                        className="text-slate-200 hover:bg-slate-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditOpen(item);
                          }}
                          title="Edit Metadata"
                          className="text-slate-200 hover:bg-slate-800"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}

                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingError(null);
                            setDeletingMedia(item);
                          }}
                          title="Delete Asset"
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Meta Info Footer */}
                <div className="p-2.5 space-y-1">
                  <span className="text-xs font-semibold text-slate-200 block truncate" title={item.title || item.fileName}>
                    {item.title || item.fileName}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="uppercase font-mono text-[10px] text-slate-400">
                      {item.type}
                    </span>
                    <span>{formatSize(item.size)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No media assets found"
          description={
            search
              ? `No files matching "${search}". Try adjusting your filters.`
              : "Upload files using the dropzone above to populate your media library."
          }
        />
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
        <span>
          Showing <span className="font-semibold text-slate-200">{mediaList.length}</span> of{" "}
          <span className="font-semibold text-slate-200">{meta.total}</span> files
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page <= 1 || isLoading}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
          </Button>
          <span>
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages || isLoading}
            className="border-slate-800 bg-slate-900 text-slate-300 text-xs"
          >
            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      <FormModal
        open={!!editingMedia}
        onOpenChange={(open) => !open && setEditingMedia(null)}
        title="Edit Media Metadata"
        description="Update alt text and title attributes for SEO and accessibility."
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Asset Title</label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Descriptive asset title"
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200">Alt Text (Accessibility &amp; SEO)</label>
            <Input
              value={editAltText}
              onChange={(e) => setEditAltText(e.target.value)}
              placeholder="Description of image for screen readers"
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingMedia(null)}
              disabled={isUpdating}
              className="border-slate-800 bg-slate-950 text-slate-300 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveMeta}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
            >
              Save Metadata
            </Button>
          </div>
        </div>
      </FormModal>

      {/* Preview Modal */}
      <FormModal
        open={!!previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
        title={previewMedia?.title || previewMedia?.fileName || "Asset Preview"}
        description={`${previewMedia?.type} • ${previewMedia?.mimeType} • ${previewMedia ? formatSize(previewMedia.size) : ""}`}
      >
        {previewMedia && (
          <div className="space-y-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center min-h-[250px]">
              {previewMedia.type === "IMAGE" ? (
                <img
                  src={previewMedia.publicUrl}
                  alt={previewMedia.altText || previewMedia.fileName}
                  className="max-h-[400px] w-auto object-contain"
                />
              ) : (
                <video controls src={previewMedia.publicUrl} className="max-h-[400px] w-full" />
              )}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-xs space-y-1 text-slate-300 font-mono break-all">
              <div>
                <span className="text-slate-500 font-sans">URL: </span>
                <a
                  href={previewMedia.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>{previewMedia.publicUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {previewMedia.altText && (
                <div>
                  <span className="text-slate-500 font-sans">Alt Text: </span>
                  <span>{previewMedia.altText}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </FormModal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingMedia}
        onOpenChange={(open) => !open && setDeletingMedia(null)}
        title="Delete Media Asset?"
        description={
          <span>
            Are you sure you want to delete <strong className="text-slate-200">{deletingMedia?.fileName}</strong>?
            This will permanently remove the stored physical file from disk.
          </span>
        }
        confirmText="Delete Asset"
        onConfirm={handleDeleteMedia}
        isLoading={isDeleting}
        error={deletingError}
      />
    </div>
  );
}

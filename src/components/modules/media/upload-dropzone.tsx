"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { UploadCloud, File, AlertCircle, CheckCircle2, X, Loader2, Image as ImageIcon, Video } from "lucide-react";

import { mediaApi } from "@/lib/api/media";
import { Button } from "@/components/ui/button";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/ogg",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface FileQueueItem {
  id: string;
  file: File;
  valid: boolean;
  error?: string;
}

interface UploadDropzoneProps {
  onUploadComplete?: () => void;
}

export function UploadDropzone({ onUploadComplete }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const mimeLower = file.type.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeLower)) {
      return {
        valid: false,
        error: `Unsupported file type (${file.type || "unknown"}). Allowed: JPEG, PNG, WEBP, GIF, MP4, WEBM, OGG.`,
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size (${sizeMB}MB) exceeds max 10MB limit.`,
      };
    }
    return { valid: true };
  };

  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: FileQueueItem[] = Array.from(files).map((file) => {
      const validation = validateFile(file);
      return {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        valid: validation.valid,
        error: validation.error,
      };
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  const handleRemoveQueueItem = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadValidFiles = async () => {
    const validItems = fileQueue.filter((item) => item.valid);
    if (validItems.length === 0) {
      toast.error("No valid files to upload");
      return;
    }

    const filesToUpload = validItems.map((item) => item.file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await mediaApi.uploadFiles(filesToUpload, (percent) => {
        setUploadProgress(percent);
      });

      if (res.success) {
        toast.success(`Successfully uploaded ${filesToUpload.length} asset(s)`);
        setFileQueue([]);
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        toast.error(res.message || "Upload failed");
      }
    } catch (err: any) {
      const msg = err.message || err.error?.details || "Failed to upload files to backend";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const validCount = fileQueue.filter((i) => i.valid).length;
  const invalidCount = fileQueue.filter((i) => !i.valid).length;

  return (
    <div className="space-y-4">
      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-500/10 scale-[0.99]"
            : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-full text-blue-400">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag &amp; drop files here, or <span className="text-blue-400 underline">browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports JPEG, PNG, WEBP, GIF, MP4, WEBM, OGG (Max 10MB per file)
            </p>
          </div>
        </div>
      </div>

      {/* Selected File Queue List */}
      {fileQueue.length > 0 && (
        <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Selected Files ({fileQueue.length})
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-semibold">{validCount} valid</span>
              {invalidCount > 0 && (
                <span className="text-red-400 font-semibold">{invalidCount} invalid</span>
              )}
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {fileQueue.map((item) => {
              const isImage = item.file.type.startsWith("image/");

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                    item.valid
                      ? "bg-slate-950/60 border-slate-800/80 text-slate-200"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {item.valid ? (
                      isImage ? (
                        <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Video className="w-4 h-4 text-purple-400 shrink-0" />
                      )
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}

                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-200 block truncate">
                        {item.file.name}
                      </span>
                      <span className="text-[11px] text-slate-400 block">
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                      {item.error && (
                        <span className="text-[11px] text-red-400 block font-medium mt-0.5">
                          {item.error}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQueueItem(item.id)}
                    disabled={isUploading}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Real Axios Upload Progress Bar */}
          {isUploading && uploadProgress !== null && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  Uploading files...
                </span>
                <span className="font-mono text-blue-400 font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFileQueue([])}
              disabled={isUploading}
              className="border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800 text-xs"
            >
              Clear Queue
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUploadValidFiles}
              disabled={isUploading || validCount === 0}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Uploading ({uploadProgress}%)...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Upload {validCount} File(s)
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

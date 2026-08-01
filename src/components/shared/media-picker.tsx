"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/modules/media/media-grid";
import { UploadDropzone } from "@/components/modules/media/upload-dropzone";
import { Media } from "@/types";
import { Image as ImageIcon, UploadCloud, Check } from "lucide-react";

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  multiple?: boolean;
  selectedIds?: string[];
  onSelect: (selected: Media[]) => void;
  title?: string;
}

export function MediaPicker({
  open,
  onOpenChange,
  multiple = false,
  selectedIds = [],
  onSelect,
  title = "Select Media Asset",
}: MediaPickerProps) {
  const [activeTab, setActiveTab] = useState<string>("library");
  const [selectedItems, setSelectedItems] = useState<Media[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleItemClick = (media: Media) => {
    if (multiple) {
      const exists = selectedItems.some((item) => item.id === media.id);
      if (exists) {
        setSelectedItems(selectedItems.filter((item) => item.id !== media.id));
      } else {
        setSelectedItems([...selectedItems, media]);
      }
    } else {
      setSelectedItems([media]);
    }
  };

  const handleConfirm = () => {
    onSelect(selectedItems);
    onOpenChange(false);
  };

  const currentSelectedIds = [
    ...selectedIds,
    ...selectedItems.map((item) => item.id),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-4xl w-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-6">
        <DialogHeader className="pb-2 border-b border-slate-800 flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-400" />
            <span>{title}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
          <TabsList className="bg-slate-950 border border-slate-800 text-slate-400">
            <TabsTrigger value="library" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media Library</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white text-xs gap-1.5">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload New File</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="pt-4 space-y-4">
            <MediaGrid
              selectMode={true}
              multiple={multiple}
              selectedIds={currentSelectedIds}
              onSelect={handleItemClick}
              onRefreshTrigger={refreshTrigger}
            />

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Selected: <span className="font-semibold text-blue-400">{selectedItems.length}</span> asset(s)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="border-slate-800 bg-slate-950 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  disabled={selectedItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Use Selected Asset ({selectedItems.length})</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="pt-4">
            <UploadDropzone
              onUploadComplete={() => {
                setRefreshTrigger((prev) => prev + 1);
                setActiveTab("library");
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

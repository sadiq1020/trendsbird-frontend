"use client";

import { useState } from "react";
import { usePermission } from "@/lib/hooks/use-permission";

import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";
import { Can } from "@/components/shared/can";
import { UploadDropzone } from "@/components/modules/media/upload-dropzone";
import { MediaGrid } from "@/components/modules/media/media-grid";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, Image as ImageIcon } from "lucide-react";

export default function MediaPage() {
  const hasWatchPermission = usePermission("media:watch");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!hasWatchPermission) {
    return (
      <ForbiddenState
        moduleName="Media Library"
        requiredPermission="media:watch"
      />
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <PageHeader
        title="Media Library"
        description="Upload, organize, and manage image & video assets for your catalog"
      />

      {/* Upload Dropzone Section */}
      <Can I="media:upload">
        <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800/80">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-200">
              <UploadCloud className="w-5 h-5 text-blue-400" />
              <span>Asset Upload Center</span>
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Upload multiple images or videos directly to server storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <UploadDropzone
              onUploadComplete={() => setRefreshTrigger((prev) => prev + 1)}
            />
          </CardContent>
        </Card>
      </Can>

      {/* Media Library Grid Section */}
      <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl">
        <CardHeader className="pb-3 border-b border-slate-800/80">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-200">
            <ImageIcon className="w-5 h-5 text-purple-400" />
            <span>Stored Catalog Assets</span>
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Filter, inspect metadata, or remove assets.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <MediaGrid onRefreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function MediaPage() {
  const hasAccess = usePermission("media:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Media Library" requiredPermission="media:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Upload, view, and manage media assets"
      />
    </div>
  );
}

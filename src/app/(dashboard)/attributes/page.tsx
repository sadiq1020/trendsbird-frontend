"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function AttributesPage() {
  const hasAccess = usePermission("attribute:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Attributes Management" requiredPermission="attribute:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attributes"
        description="Manage product attributes and value options"
      />
    </div>
  );
}

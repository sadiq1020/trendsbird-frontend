"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function BrandsPage() {
  const hasAccess = usePermission("brand:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Brands Management" requiredPermission="brand:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        description="Manage product brands and logos"
      />
    </div>
  );
}

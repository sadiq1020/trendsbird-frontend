"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function ProductsPage() {
  const hasAccess = usePermission("product:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Products Management" requiredPermission="product:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage product catalog, inventory, and variants"
      />
    </div>
  );
}

"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function CategoriesPage() {
  const hasAccess = usePermission("category:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Categories Management" requiredPermission="category:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize product catalog categories and sub-categories"
      />
    </div>
  );
}

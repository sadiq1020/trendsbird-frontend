"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function RolesPage() {
  const hasAccess = usePermission("role:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Roles Management" requiredPermission="role:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage user roles and granted permission matrices"
      />
    </div>
  );
}

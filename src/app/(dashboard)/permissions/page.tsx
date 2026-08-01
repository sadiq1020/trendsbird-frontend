"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function PermissionsPage() {
  const hasAccess = usePermission("permission:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Permissions Management" requiredPermission="permission:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Permissions"
        description="Manage system permission groups and individual actions"
      />
    </div>
  );
}

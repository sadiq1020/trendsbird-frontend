"use client";

import { usePermission } from "@/lib/hooks/use-permission";
import { PageHeader } from "@/components/shared/page-header";
import { ForbiddenState } from "@/components/shared/forbidden-state";

export default function UsersPage() {
  const hasAccess = usePermission("user:watch");

  if (!hasAccess) {
    return <ForbiddenState moduleName="Users Management" requiredPermission="user:watch" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage user accounts, roles, and status"
      />
    </div>
  );
}

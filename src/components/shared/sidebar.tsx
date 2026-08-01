"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermission } from "@/lib/hooks/use-permission";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  KeyRound,
  ShieldCheck,
  Users,
  Image,
  FolderTree,
  Tag,
  Sliders,
  Package,
  Sparkles,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    groupLabel: "Main",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    groupLabel: "Catalog Management",
    items: [
      {
        title: "Products",
        href: "/products",
        icon: Package,
        permission: "product:watch",
      },
      {
        title: "Categories",
        href: "/categories",
        icon: FolderTree,
        permission: "category:watch",
      },
      {
        title: "Brands",
        href: "/brands",
        icon: Tag,
        permission: "brand:watch",
      },
      {
        title: "Attributes",
        href: "/attributes",
        icon: Sliders,
        permission: "attribute:watch",
      },
      {
        title: "Media Library",
        href: "/media",
        icon: Image,
        permission: "media:watch",
      },
    ],
  },
  {
    groupLabel: "Access & Security",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users,
        permission: "user:watch",
      },
      {
        title: "Roles",
        href: "/roles",
        icon: ShieldCheck,
        permission: "role:watch",
      },
      {
        title: "Permissions",
        href: "/permissions",
        icon: KeyRound,
        permission: "permission:watch",
      },
    ],
  },
];

function NavItemLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const hasAccess = usePermission(item.permission || "");

  if (item.permission && !hasAccess) {
    return null;
  }

  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
      )}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-slate-400")} />
      <span>{item.title}</span>
    </Link>
  );
}

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "w-64 border-r border-slate-800 bg-slate-900/90 flex flex-col justify-between shrink-0",
        className
      )}
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base tracking-tight text-white">Trends Bird</h2>
            <p className="text-xs text-slate-400">Control Center</p>
          </div>
        </div>

        <nav className="space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.permission || checkPermissionSimple(item.permission)
            );

            return (
              <NavGroupSection key={group.groupLabel} group={group} />
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 text-center">
        v1.0.0 &bull; Trends Bird Admin
      </div>
    </aside>
  );
}

function NavGroupSection({ group }: { group: NavGroup }) {
  const permissions = usePermission;

  const validItems = group.items.filter((item) => {
    if (!item.permission) return true;
    return permissions(item.permission);
  });

  if (validItems.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {group.groupLabel}
      </div>
      <div className="space-y-1">
        {group.items.map((item) => (
          <NavItemLink key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
}

function checkPermissionSimple(_perm: string) {
  return true;
}

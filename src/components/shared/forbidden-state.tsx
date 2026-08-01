import React from "react";
import { ShieldX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ForbiddenStateProps {
  moduleName?: string;
  requiredPermission?: string;
}

export function ForbiddenState({ moduleName = "this screen", requiredPermission }: ForbiddenStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-red-900/30 rounded-xl bg-red-950/10 my-6 space-y-4">
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-full text-red-400">
        <ShieldX className="w-10 h-10" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-slate-100">403 — Access Restricted</h2>
        <p className="text-sm text-slate-400">
          You do not have the required permission to access <span className="text-slate-200 font-semibold">{moduleName}</span>.
        </p>
        {requiredPermission && (
          <p className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded inline-block">
            Required: {requiredPermission}
          </p>
        )}
      </div>
      <div className="pt-2">
        <Link
          href="/dashboard"
          className={cn(buttonVariants({ variant: "outline" }), "border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800")}
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useSessionStore } from "@/lib/stores/session-store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, UserCheck, Key, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const { user, role, permissions } = useSessionStore();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-slate-400 text-sm">
          Welcome back, <span className="text-slate-200 font-semibold">{user?.name}</span> ({user?.email})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Authenticated User</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-slate-100">{user?.name}</div>
            <p className="text-xs text-slate-400 mt-1">{user?.email}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Role</CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-emerald-400">{role?.name || "N/A"}</div>
            <p className="text-xs text-slate-400 mt-1">Status: {user?.status}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Granted Permissions</CardTitle>
            <Key className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-400">{permissions.length} Permissions</div>
            <p className="text-xs text-slate-400 mt-1">Loaded from backend session</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Auth &amp; Cookie Interceptor Verification</span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Current active session permissions granted to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {permissions.length > 0 ? (
              permissions.map((perm) => (
                <span
                  key={perm}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 border border-slate-700 text-slate-300"
                >
                  {perm}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">No explicit permissions attached</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

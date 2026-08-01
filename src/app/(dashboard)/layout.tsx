"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/lib/stores/session-store";
import { authApi } from "@/lib/api/auth";
import { Sidebar } from "@/components/shared/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { LogOut, Shield, Loader2, Menu } from "lucide-react";
import { toast } from "sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoading, clearSession } = useSessionStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      clearSession();
      toast.success("Logged out successfully");
      router.replace("/login");
    } catch {
      clearSession();
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="font-medium text-slate-200">Verifying session permissions...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex h-screen sticky top-0" />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden text-slate-400">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                }
              />
              <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-slate-800 text-slate-100">
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <Sidebar className="w-full h-full border-r-0" />
              </SheetContent>
            </Sheet>

            <span className="text-sm font-semibold text-slate-400 hidden sm:inline-block">
              Trends Bird Admin Panel
            </span>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
              <Avatar className="w-6 h-6 border border-slate-700">
                <AvatarImage src={user?.avatar || undefined} alt={user?.name || "User"} />
                <AvatarFallback className="bg-blue-600 text-[10px] text-white font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-200 max-w-[120px] truncate">
                  {user?.name || user?.email}
                </span>
                <span className="text-slate-600">&bull;</span>
                <div className="flex items-center gap-1 text-emerald-400 font-semibold uppercase text-[10px]">
                  <Shield className="w-3 h-3" />
                  <span>{role?.name || "User"}</span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-800 bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors gap-2 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

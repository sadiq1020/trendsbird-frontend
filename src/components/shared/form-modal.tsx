"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface FormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "dialog" | "sheet";
  className?: string;
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  variant = "dialog",
}: FormModalProps) {
  if (variant === "sheet") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg w-full overflow-y-auto overflow-x-hidden">
          <SheetHeader className="pb-4 border-b border-slate-800/80">
            <SheetTitle className="text-xl font-bold text-slate-100">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-slate-400 text-sm">{description}</SheetDescription>
            )}
          </SheetHeader>
          <div className="py-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-slate-100">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-slate-400 text-sm">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="py-2 overflow-x-hidden">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

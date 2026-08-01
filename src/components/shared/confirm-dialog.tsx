"use client";

import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false,
  error = null,
  destructive = true,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
    }
  };

  const loading = isLoading || internalLoading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-full border ${
                destructive
                  ? "bg-red-500/10 border-red-500/20 text-red-400"
                  : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-slate-100">
              {title}
            </AlertDialogTitle>
          </div>

          <AlertDialogDescription className="text-slate-400 text-sm">
            {description}
          </AlertDialogDescription>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-start gap-2.5 mt-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Action Blocked by Backend</span>
                <p className="text-red-300/90">{error}</p>
              </div>
            </div>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4 flex gap-2 sm:justify-end">
          <AlertDialogCancel
            disabled={loading}
            className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {cancelText}
          </AlertDialogCancel>

          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={loading}
            onClick={handleConfirm}
            className={
              destructive
                ? "bg-red-600 hover:bg-red-500 text-white font-medium"
                : "bg-blue-600 hover:bg-blue-500 text-white font-medium"
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import React from 'react';
import { usePermission } from '@/lib/hooks/use-permission';

interface CanProps {
  I: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ I, requireAll, fallback = null, children }: CanProps) {
  const allowed = usePermission(I, { requireAll });

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

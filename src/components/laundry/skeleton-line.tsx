"use client";

import { cn } from "@/lib/utils";

export function SkeletonLine({ className }: { className?: string }) {
  return <span className={cn("inline-block animate-pulse rounded-full bg-muted", className)} />;
}

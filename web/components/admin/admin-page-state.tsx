"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPageLoading() {
  return (
    <div className="min-h-[320px] space-y-4" role="status" aria-label="Loading page">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-[10px] border border-[#e6edf5] bg-white p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="mt-5 h-7 w-20" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.53fr)_minmax(300px,1fr)]">
        <div className="rounded-[10px] border border-[#e6edf5] bg-white p-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="mt-5 h-[190px] w-full rounded-[8px]" />
        </div>
        <div className="rounded-[10px] border border-[#e6edf5] bg-white p-4">
          <Skeleton className="h-5 w-28" />
          <div className="mt-5 space-y-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-10" />
                </div>
                <Skeleton className="mt-2 h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e6edf5] bg-white">
        <div className="flex items-center justify-between border-b border-[#edf1f6] p-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-0 px-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="flex items-center gap-4 border-b border-[#edf1f6] py-4 last:border-0">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-2 h-3 w-20" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export function AdminPageError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
      <p className="text-[13px] text-[#52627A]">{message}</p>
      <Button type="button" onClick={retry} size="sm">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

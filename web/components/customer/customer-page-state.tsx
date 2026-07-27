"use client";

import { RotateCw } from "lucide-react";

export function CustomerPageSkeleton({
  rows = 4,
}: {
  rows?: number;
}) {
  return (
    <div
      className="min-h-screen bg-[#fafafe] text-[#17182c]"
      role="status"
      aria-label="Loading page"
    >
      <div className="h-14 border-b border-[#efedf5] bg-white" />
      <main className="mx-auto max-w-[720px] space-y-3 px-4 py-4">
        <div className="h-24 animate-pulse rounded-[12px] bg-[#ece9f2]" />
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="h-[72px] animate-pulse rounded-[12px] bg-[#ece9f2]"
          />
        ))}
      </main>
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function CustomerPageError({
  message,
  retry,
}: {
  message: string;
  retry: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafafe] px-4 text-[#17182c]">
      <div className="w-full max-w-[360px] rounded-[12px] border border-[#e5e2eb] bg-white p-5 text-center">
        <p className="text-[12px] font-bold">Could not load this page</p>
        <p className="mt-2 text-[10px] text-[#77798a]">{message}</p>
        <button
          type="button"
          onClick={retry}
          className="mx-auto mt-4 flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#7440dc] px-5 text-[11px] font-bold text-white"
        >
          <RotateCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}

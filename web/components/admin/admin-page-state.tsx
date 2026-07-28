"use client";

import { Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminPageLoading() {
  return (
    <div className="flex min-h-[320px] items-center justify-center" role="status">
      <Loader2 className="h-6 w-6 animate-spin text-[#075DFF]" />
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

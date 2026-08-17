"use client";

import { RotateCw } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

type CustomerSkeletonVariant = "dashboard" | "services" | "detail" | "list" | "form";

function CustomerHeaderSkeleton() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-[#efedf5] bg-white px-4">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-9 rounded-full" />
    </div>
  );
}

function ServiceRowSkeleton() {
  return (
    <div className="flex min-h-[104px] items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3">
      <Skeleton className="h-[68px] w-[68px] shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-5 w-24 rounded-full" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-8 w-16 rounded-[8px]" />
      </div>
    </div>
  );
}

function CustomerDashboardSkeleton() {
  return (
    <>
      <div className="relative h-[238px] overflow-hidden bg-[#ddd0fb]">
        <Skeleton className="absolute inset-0 rounded-none bg-[#d8c9f7]" />
        <div className="relative flex items-center justify-between px-4 pt-6">
          <Skeleton className="h-5 w-32 bg-white/50" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-16 rounded-full bg-white/50" />
            <Skeleton className="h-10 w-10 rounded-full bg-white/50" />
          </div>
        </div>
        <Skeleton className="absolute bottom-14 left-4 h-7 w-36 bg-white/50" />
      </div>
      <main className="relative z-10 mx-auto -mt-5 max-w-[1120px] space-y-5 px-3">
        <div className="rounded-[12px] border border-[#eeecf7] bg-white px-3 py-5 shadow-[0_10px_32px_rgba(58,39,108,0.09)]">
          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <Skeleton className="h-[50px] w-[50px] rounded-full" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
        <Skeleton className="h-[88px] w-full rounded-[12px]" />
        <div>
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex min-h-[124px] flex-col items-center justify-center gap-3 rounded-[12px] border border-[#e7e8f0] bg-white">
                <Skeleton className="h-[58px] w-[58px] rounded-[10px]" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

function CustomerServicesSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <CustomerHeaderSkeleton />
      <main className="mx-auto w-full max-w-[720px] px-3 py-4">
        <Skeleton className="h-11 w-full rounded-[12px]" />
        <div className="mt-4 flex gap-1.5 overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-[66px] w-[72px] shrink-0 rounded-[10px]" />
          ))}
        </div>
        <section className="mt-4 space-y-2.5">
          {Array.from({ length: rows }, (_, index) => <ServiceRowSkeleton key={index} />)}
        </section>
      </main>
    </>
  );
}

function CustomerDetailSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <CustomerHeaderSkeleton />
      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        <Skeleton className="h-[116px] w-full rounded-[12px]" />
        <div className="mt-4 grid grid-cols-2 gap-2 border-b border-[#dfdbe7] pb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <section className="mt-3 space-y-2">
          {Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex h-[62px] items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3">
              <Skeleton className="h-[46px] w-[46px] rounded-[8px]" />
              <div className="flex-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="mt-2 h-3 w-16" />
              </div>
              <Skeleton className="h-7 w-20 rounded-[8px]" />
            </div>
          ))}
        </section>
      </main>
    </>
  );
}

function CustomerListSkeleton({ rows }: { rows: number }) {
  return (
    <>
      <CustomerHeaderSkeleton />
      <main className="mx-auto w-full max-w-[720px] space-y-3 px-4 py-4">
        <Skeleton className="h-20 w-full rounded-[12px]" />
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex h-[72px] items-center gap-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </main>
    </>
  );
}

function CustomerFormSkeleton() {
  return (
    <>
      <CustomerHeaderSkeleton />
      <main className="mx-auto w-full max-w-[720px] space-y-4 px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-10 rounded-[10px]" />)}
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index}>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-11 w-full rounded-[10px]" />
          </div>
        ))}
        <Skeleton className="h-11 w-full rounded-[12px]" />
      </main>
    </>
  );
}

export function CustomerPageSkeleton({
  rows = 4,
  variant = "list",
}: {
  rows?: number;
  variant?: CustomerSkeletonVariant;
}) {
  return (
    <div
      className="min-h-screen overflow-x-hidden bg-[#fafafe] text-[#17182c]"
      role="status"
      aria-label="Loading page"
    >
      {variant === "dashboard" ? <CustomerDashboardSkeleton /> : null}
      {variant === "services" ? <CustomerServicesSkeleton rows={rows} /> : null}
      {variant === "detail" ? <CustomerDetailSkeleton rows={rows} /> : null}
      {variant === "list" ? <CustomerListSkeleton rows={rows} /> : null}
      {variant === "form" ? <CustomerFormSkeleton /> : null}
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

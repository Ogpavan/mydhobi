"use client";

import { Shirt, Sparkles, WashingMachine } from "lucide-react";

export function LaundryIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-md bg-emerald-950/35 p-6">
      <div className="organic-blob absolute -right-10 -top-8 size-36 bg-emerald-300/20" />
      <div className="organic-blob absolute -bottom-10 -left-8 size-32 bg-white/15" />
      <div className="absolute left-8 top-9 h-2 w-32 rounded-full bg-orange-400" />
      <div className="absolute left-10 top-5 flex gap-3">
        <span className="h-12 w-8 rounded-t-md bg-white shadow-card" />
        <span className="mt-2 h-10 w-7 rounded-t-md bg-emerald-100 shadow-card" />
        <span className="mt-5 h-7 w-16 rounded-md bg-orange-200 shadow-card" />
      </div>
      <div className="absolute bottom-9 left-8 grid size-40 place-items-center rounded-md bg-white shadow-soft">
        <div className="grid size-28 place-items-center rounded-full border-[10px] border-slate-200 bg-slate-100">
          <WashingMachine className="size-12 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-16 right-10 flex h-36 w-28 flex-col items-center justify-end rounded-t-full bg-orange-400 shadow-card">
        <div className="mb-14 size-14 rounded-full bg-amber-100" />
        <Shirt className="absolute bottom-7 size-20 -rotate-6 text-white" />
      </div>
      <Sparkles className="absolute right-8 top-28 size-7 text-orange-300" />
      <Sparkles className="absolute left-8 bottom-56 size-5 text-emerald-100" />
    </div>
  );
}

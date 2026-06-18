"use client";

import { ChevronRight, Shirt, Sparkles, WashingMachine } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/mock-data";

function SharedServiceIllustration({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "relative mb-5 h-36 overflow-hidden rounded-md bg-primary text-primary-foreground",
        compact && "h-28",
      )}
      aria-hidden="true"
    >
      <div className="organic-blob absolute -right-7 -top-8 size-24 bg-white/14" />
      <div className="organic-blob absolute -bottom-10 -left-8 size-28 bg-emerald-300/16" />
      <div className="absolute left-5 top-5 h-1.5 w-24 rounded-full bg-accent" />
      <div className="absolute left-6 top-2 flex items-end gap-2">
        <span className="h-9 w-6 rounded-md bg-white shadow-card" />
        <span className="h-7 w-5 rounded-md bg-emerald-100 shadow-card" />
        <span className="h-5 w-12 rounded-md bg-orange-200 shadow-card" />
      </div>
      <div className="absolute bottom-4 left-5 grid size-24 place-items-center rounded-md bg-white shadow-soft">
        <div className="grid size-16 place-items-center rounded-full border-[7px] border-slate-200 bg-slate-100">
          <WashingMachine className="size-8 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-5 right-6 grid size-20 place-items-center rounded-md bg-orange-400 shadow-card">
        <Shirt className="size-12 text-white" />
      </div>
      <Sparkles className="absolute right-6 top-7 size-5 text-orange-200" />
      <Sparkles className="absolute left-9 bottom-24 size-4 text-emerald-100" />
    </div>
  );
}

export function ServiceCard({ service, active, onClick, compact = false }: { service: Service; active?: boolean; onClick?: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex h-full w-full flex-col rounded-md border bg-white p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft",
        active ? "border-primary/50 ring-2 ring-primary/10" : "border-border/80",
        compact && "p-4",
      )}
    >
      <SharedServiceIllustration compact={compact} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-foreground">{service.name}</h3>
          {!compact && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{service.description}</p>}
        </div>
        <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <div className="mt-5 flex items-center justify-between text-sm">
        <span className="font-bold text-primary">From ₹{service.priceFrom}</span>
        <span className="rounded-md bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{service.turnaround}</span>
      </div>
    </button>
  );
}

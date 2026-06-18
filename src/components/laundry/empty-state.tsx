"use client";

import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-white/70 p-8 text-center shadow-sm">
      <span className="mx-auto grid size-14 place-items-center rounded-md bg-secondary text-primary">
        <PackageCheck className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-extrabold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && <Button className="mt-5" variant="accent" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

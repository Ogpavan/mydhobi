"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden rounded-md bg-primary p-6 text-primary-foreground shadow-soft sm:p-8", className)}>
      <div className="organic-blob absolute -right-12 -top-16 size-48 bg-white/13" />
      <div className="organic-blob absolute -bottom-20 left-8 size-36 bg-emerald-300/15" />
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          {eyebrow && <p className="mb-2 text-sm font-bold text-emerald-100/90">{eyebrow}</p>}
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/85 sm:text-base">{description}</p>}
        </div>
        {actions && <div className="relative z-10 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </section>
  );
}

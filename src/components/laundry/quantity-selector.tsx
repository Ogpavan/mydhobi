"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantitySelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex h-10 items-center gap-2 rounded-md bg-secondary px-1">
      <Button variant="outline" size="icon" className="size-8 bg-white" onClick={() => onChange(value - 1)} disabled={value <= 0} aria-label="Decrease quantity">
        <Minus className="size-4" />
      </Button>
      <span className="w-7 text-center text-sm font-extrabold text-foreground">{value}</span>
      <Button variant="outline" size="icon" className="size-8 bg-white" onClick={() => onChange(value + 1)} aria-label="Increase quantity">
        <Plus className="size-4" />
      </Button>
    </div>
  );
}

"use client";

import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/format";

export function PriceSummary({ subtotal, deliveryCharge, total }: { subtotal: number; deliveryCharge: number; total: number }) {
  return (
    <div className="rounded-md border border-border/80 bg-white p-5 shadow-card">
      <h3 className="text-base font-extrabold text-foreground">Price Summary</h3>
      <div className="mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="font-bold text-foreground">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Delivery Charge</span>
          <span className="font-bold text-foreground">{deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}</span>
        </div>
        <Separator />
        <div className="flex items-center justify-between text-base font-extrabold text-foreground">
          <span>Total</span>
          <span className="text-accent">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

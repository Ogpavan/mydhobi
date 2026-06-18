"use client";

import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/laundry/status-badge";
import { IconByName } from "@/components/laundry/icon-map";
import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/mock-data";

export function OrderCard({ order }: { order: Order }) {
  return (
    <Link href={`/orders/${order.id}`} className="block group">
      <Card className="overflow-hidden p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/25 hover:shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold text-muted-foreground">#{order.id}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-md bg-secondary text-primary">
                <IconByName name={order.serviceId === "wash-iron" ? "washing-machine" : order.serviceId === "dry-cleaning" ? "shirt" : order.serviceId === "darning" ? "scissors" : "sparkles"} />
              </span>
              <div>
                <h3 className="font-extrabold text-foreground">{order.serviceName}</h3>
                <p className="text-sm text-muted-foreground">{order.items.reduce((sum, item) => sum + item.quantity, 0)} items</p>
              </div>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{order.pickupTime}</span>
          <span className="flex items-center gap-2"><Truck className="size-4 text-primary" />{order.deliveryTime}</span>
          <span className="flex items-center gap-2 sm:col-span-2"><MapPin className="size-4 text-primary" />{order.address}</span>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Total</p>
            <p className="text-lg font-extrabold text-accent">{formatCurrency(order.total)}</p>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-primary">View Details <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
        </div>
      </Card>
    </Link>
  );
}

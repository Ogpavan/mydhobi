"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, PackageCheck, RotateCcw, Truck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/laundry/empty-state";
import { PriceSummary } from "@/components/laundry/price-summary";
import { StatusBadge } from "@/components/laundry/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getOrderById } from "@/lib/mock-data";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const order = getOrderById(params.id);

  if (!order) {
    return (
      <AppShell>
        <EmptyState title="Order not found" description="The order ID does not match any mock order." />
      </AppShell>
    );
  }

  return (
    <AppShell className="space-y-6">
      <Button asChild variant="ghost" className="pl-0">
        <Link href="/orders"><ArrowLeft className="size-4" /> Back to orders</Link>
      </Button>
      <section className="relative overflow-hidden rounded-md bg-primary p-6 text-primary-foreground shadow-soft sm:p-8">
        <div className="organic-blob absolute -right-10 -top-12 size-48 bg-white/12" />
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-emerald-100">Order Details</p>
            <h1 className="mt-2 text-3xl font-extrabold">#{order.id}</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-50/85">{order.serviceName} for {order.customerName}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-2xl font-extrabold text-foreground">Timeline</h2>
            <div className="mt-6 space-y-1">
              {order.timeline.map((item, index) => (
                <div key={item.id} className="grid grid-cols-[2rem_1fr] gap-3">
                  <div className="flex flex-col items-center">
                    <span className={cn("grid size-8 place-items-center rounded-full border-2", item.completed ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-muted-foreground")}>
                      <PackageCheck className="size-4" />
                    </span>
                    {index < order.timeline.length - 1 && <span className={cn("h-12 w-px", item.completed ? "bg-primary" : "bg-border")} />}
                  </div>
                  <div className="pb-6">
                    <p className="font-extrabold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    <p className="mt-1 text-xs font-bold text-primary">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-2xl font-extrabold text-foreground">Pickup and delivery</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-md bg-secondary/70 p-4"><CalendarDays className="mb-3 size-5 text-primary" /><p className="font-extrabold">Pickup</p><p className="mt-1 text-sm text-muted-foreground">{order.pickupTime}</p></div>
              <div className="rounded-md bg-secondary/70 p-4"><Truck className="mb-3 size-5 text-primary" /><p className="font-extrabold">Delivery</p><p className="mt-1 text-sm text-muted-foreground">{order.deliveryTime}</p></div>
              <div className="rounded-md bg-secondary/70 p-4 md:col-span-2"><MapPin className="mb-3 size-5 text-primary" /><p className="font-extrabold">Address</p><p className="mt-1 text-sm text-muted-foreground">{order.address}</p></div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-2xl font-extrabold text-foreground">Items</h2>
            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-border bg-white p-4">
                  <div><p className="font-extrabold text-foreground">{item.name}</p><p className="text-sm text-muted-foreground">{item.category} - Qty {item.quantity}</p></div>
                  <p className="font-extrabold text-accent">₹{item.unitPrice * item.quantity}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <PriceSummary subtotal={order.subtotal} deliveryCharge={order.deliveryCharge} total={order.total} />
          <Card className="p-5">
            <h3 className="font-extrabold text-foreground">Rider</h3>
            <Separator className="my-4" />
            <p className="font-bold">{order.riderName}</p>
            <p className="mt-1 text-sm text-muted-foreground">{order.riderPhone || "Assigned after confirmation"}</p>
          </Card>
          <Button asChild variant="accent" size="lg" className="w-full">
            <Link href="/book"><RotateCcw className="size-5" /> Reorder</Link>
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}

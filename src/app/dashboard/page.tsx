"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, Plus, Truck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OrderCard } from "@/components/laundry/order-card";
import { ServiceCard } from "@/components/laundry/service-card";
import { StatusBadge } from "@/components/laundry/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SkeletonLine } from "@/components/laundry/skeleton-line";
import { notifications, orders, services } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

async function fetchStats() {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Could not load stats");
  return response.json() as Promise<{ data: { totalOrders: number; revenue: number; pendingPickup: number; readyDelivery: number } }>;
}

export default function DashboardPage() {
  const activeOrder = orders.find((order) => order.status !== "delivered") ?? orders[0];
  const recentOrders = orders.slice(0, 3);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchStats });

  return (
    <AppShell className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="relative overflow-hidden rounded-md bg-primary p-6 text-primary-foreground shadow-soft sm:p-8">
          <div className="organic-blob absolute -right-12 -top-14 size-48 bg-white/13" />
          <div className="relative z-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-100">Welcome back,</p>
              <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Priya Sharma</h1>
              <p className="mt-3 text-sm leading-6 text-emerald-50/80">How can we help your wardrobe today?</p>
            </div>
            <Button asChild variant="accent" size="lg">
              <Link href="/book"><Plus className="size-5" /> New Pickup</Link>
            </Button>
          </div>
          <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md bg-white/10 p-4">
              <p className="text-xs font-bold text-emerald-50/75">Total Orders</p>
              <p className="mt-2 text-2xl font-extrabold">{isLoading ? <SkeletonLine className="h-7 w-16 bg-white/20" /> : data?.data.totalOrders}</p>
            </div>
            <div className="rounded-md bg-white/10 p-4">
              <p className="text-xs font-bold text-emerald-50/75">Active</p>
              <p className="mt-2 text-2xl font-extrabold">{isLoading ? <SkeletonLine className="h-7 w-16 bg-white/20" /> : data?.data.pendingPickup}</p>
            </div>
            <div className="rounded-md bg-white/10 p-4">
              <p className="text-xs font-bold text-emerald-50/75">Spend</p>
              <p className="mt-2 text-2xl font-extrabold">{isLoading ? <SkeletonLine className="h-7 w-20 bg-white/20" /> : formatCurrency(data?.data.revenue ?? 0)}</p>
            </div>
          </div>
        </div>
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold text-primary">Active order</p>
              <h2 className="mt-1 text-xl font-extrabold text-foreground">#{activeOrder.id}</h2>
            </div>
            <StatusBadge status={activeOrder.status} />
          </div>
          <div className="mt-5 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><Truck className="size-4 text-primary" />{activeOrder.serviceName}</p>
            <p className="flex items-center gap-2"><CalendarDays className="size-4 text-primary" />{activeOrder.deliveryTime}</p>
          </div>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link href={`/orders/${activeOrder.id}`}>Track Order</Link>
          </Button>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-primary">Services</p>
            <h2 className="text-2xl font-extrabold text-foreground">Choose your care</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/book">View all</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => <ServiceCard key={service.id} service={service} compact />)}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-foreground">Recent orders</h2>
            <Button asChild variant="outline"><Link href="/orders">All Orders</Link></Button>
          </div>
          <div className="grid gap-4">
            {recentOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-foreground">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Button asChild variant="accent" className="h-14 justify-start rounded-md"><Link href="/book"><Plus /> Book Pickup</Link></Button>
            <Button asChild variant="outline" className="h-14 justify-start rounded-md"><Link href="/orders"><Truck /> Track Orders</Link></Button>
          </div>
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2"><Bell className="size-5 text-primary" /><h3 className="font-extrabold">Notifications</h3></div>
            <div className="space-y-3">
              {notifications.map((item) => <div key={item.id} className="rounded-md bg-secondary/70 p-3"><p className="text-sm font-extrabold">{item.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p></div>)}
            </div>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}

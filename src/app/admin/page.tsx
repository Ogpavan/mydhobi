"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw } from "lucide-react";
import { AdminOrderTable } from "@/components/admin/admin-order-table";
import { AdminShell } from "@/components/admin/admin-shell";
import { StatCard } from "@/components/admin/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orders } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

async function fetchStats() {
  const response = await fetch("/api/dashboard/stats");
  if (!response.ok) throw new Error("Could not load stats");
  return response.json() as Promise<{ data: { totalOrders: number; pendingPickup: number; inWashing: number; readyDelivery: number; revenue: number } }>;
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchStats });
  const stats = data?.data;

  return (
    <AdminShell className="space-y-8">
      <PageHeader
        eyebrow="Operations overview"
        title="Laundry command center"
        description="Monitor orders, rider movement, service queues, and revenue from one clean CRM-style workspace."
        actions={
          <>
            <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/18"><RefreshCw className="size-4" /> Refresh</Button>
            <Button variant="accent"><Download className="size-4" /> Export</Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Orders" value={isLoading ? "..." : String(stats?.totalOrders ?? 0)} helper="All active mock orders" icon="clipboard-list" />
        <StatCard label="Pending Pickup" value={isLoading ? "..." : String(stats?.pendingPickup ?? 0)} helper="Needs rider assignment" icon="truck" tone="accent" />
        <StatCard label="In Washing" value={isLoading ? "..." : String(stats?.inWashing ?? 0)} helper="Processing now" icon="washing-machine" tone="sky" />
        <StatCard label="Ready Delivery" value={isLoading ? "..." : String(stats?.readyDelivery ?? 0)} helper="Dispatch queue" icon="package-check" tone="emerald" />
        <StatCard label="Revenue" value={isLoading ? "..." : formatCurrency(stats?.revenue ?? 0)} helper="Mock revenue" icon="indian-rupee" />
      </div>
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-primary">Recent orders</p>
            <h2 className="text-2xl font-extrabold text-foreground">Status management</h2>
          </div>
        </div>
        <AdminOrderTable orders={orders} />
      </section>
      <div className="grid gap-4 lg:grid-cols-3">
        {["Pickup load", "Cleaning queue", "Delivery readiness"].map((label, index) => (
          <Card key={label} className="p-5">
            <p className="text-sm font-bold text-muted-foreground">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-foreground">{[72, 48, 81][index]}%</p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent" style={{ width: `${[72, 48, 81][index]}%` }} /></div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

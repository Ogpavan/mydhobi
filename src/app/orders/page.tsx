"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/laundry/empty-state";
import { OrderCard } from "@/components/laundry/order-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/constants";
import { orders } from "@/lib/mock-data";

type FilterValue = "all" | OrderStatus;

const filters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "delivered", label: ORDER_STATUS_META.delivered.label },
  { value: "in-progress", label: ORDER_STATUS_META["in-progress"].label },
  { value: "pending-pickup", label: ORDER_STATUS_META["pending-pickup"].label },
  { value: "out-for-delivery", label: ORDER_STATUS_META["out-for-delivery"].label },
];

export default function OrdersPage() {
  const [filter, setFilter] = useState<FilterValue>("all");
  const filteredOrders = useMemo(() => (filter === "all" ? orders : orders.filter((order) => order.status === filter)), [filter]);

  return (
    <AppShell className="space-y-8">
      <PageHeader
        eyebrow="My orders"
        title="Track every laundry order"
        description="Review pickup, delivery, payment, and current status in a card layout inspired by the mobile reference."
        actions={<Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/18"><Filter className="size-4" /> Filter</Button>}
      />
      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterValue)}>
        <div className="overflow-x-auto no-scrollbar pb-2">
          <TabsList>
            {filters.map((item) => <TabsTrigger key={item.value} value={item.value}>{item.label}</TabsTrigger>)}
          </TabsList>
        </div>
      </Tabs>
      {filteredOrders.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredOrders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      ) : (
        <EmptyState title="No orders found" description="Try another status filter or create a new pickup request." actionLabel="Book Pickup" />
      )}
    </AppShell>
  );
}

"use client";

import { ClipboardList, Filter } from "lucide-react";
import { AdminOrderTable } from "@/components/admin/admin-order-table";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/laundry/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { orders } from "@/lib/mock-data";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/constants";

export default function AdminOrdersPage() {
  return (
    <AdminShell className="space-y-8">
      <PageHeader
        eyebrow="Order management"
        title="Manage pickups, cleaning, and delivery"
        description="Update statuses, inspect totals, and keep daily operations moving from a responsive order table."
        actions={<Button variant="accent"><Filter className="size-4" /> Filters</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {ORDER_STATUSES.map((status) => (
          <Card key={status} className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <ClipboardList className="size-5 text-primary" />
              <StatusBadge status={status} />
            </div>
            <p className="text-2xl font-extrabold text-foreground">{orders.filter((order) => order.status === status).length}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{ORDER_STATUS_META[status].description}</p>
          </Card>
        ))}
      </div>
      <AdminOrderTable orders={orders} />
    </AdminShell>
  );
}

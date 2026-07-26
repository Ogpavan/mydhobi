"use client";

import {
  CheckCircle2,
  IndianRupee,
  PackageCheck,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  AdminOrder,
  AdminOrderStats,
  AdminOrderSummary,
} from "@/lib/admin-orders";
import {
  allowedOrderTransitions,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const statusTone: Record<PortalOrderStatus, string> = {
  New: "border-blue-200 bg-blue-50 text-blue-700",
  "Picked Up": "border-cyan-200 bg-cyan-50 text-cyan-700",
  "In Cleaning": "border-amber-200 bg-amber-50 text-amber-700",
  Ready: "border-violet-200 bg-violet-50 text-violet-700",
  "Out for Delivery": "border-orange-200 bg-orange-50 text-orange-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: PortalOrderStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusTone[status])}>
      {status}
    </Badge>
  );
}

export function AdminOrdersList({
  initialOrders,
  stats,
}: {
  initialOrders: AdminOrderSummary[];
  stats: AdminOrderStats;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PortalOrderStatus | "All">("All");
  const orders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return initialOrders.filter((order) => {
      const matchesSearch =
        !search ||
        `${order.id} ${order.customerName} ${order.customerMobile} ${order.service}`
          .toLowerCase()
          .includes(search);
      return matchesSearch && (status === "All" || order.status === status);
    });
  }, [initialOrders, query, status]);

  const cards = [
    {
      label: "Total Orders",
      value: stats.total.toLocaleString("en-IN"),
      icon: PackageCheck,
      tone: "text-[#075DFF]",
    },
    {
      label: "In Process",
      value: stats.inProcess.toLocaleString("en-IN"),
      icon: SlidersHorizontal,
      tone: "text-[#FF7A00]",
    },
    {
      label: "Ready",
      value: stats.ready.toLocaleString("en-IN"),
      icon: CheckCircle2,
      tone: "text-[#0C9E78]",
    },
    {
      label: "Today Revenue",
      value: `₹${stats.todayRevenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      tone: "text-[#6D28D9]",
    },
  ];

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label}>
            <CardContent className="flex h-[96px] items-center gap-3 p-4">
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded bg-[#EEF5FF]",
                  tone,
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <div>
                <p className="text-[12px] text-[#52627A]">{label}</p>
                <p className="mt-2 text-[22px] font-semibold text-[#071333]">
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="space-y-3 p-4">
          <label className="relative block max-w-[380px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
            <span className="sr-only">Search orders</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, or mobile"
              className="pl-9"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                "All",
                "New",
                "Picked Up",
                "In Cleaning",
                "Ready",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
              ] as const
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(item)}
                className={cn(
                  "whitespace-nowrap rounded border px-3 py-1.5 text-[11px]",
                  status === item
                    ? "border-[#075DFF] bg-[#EEF5FF] text-[#075DFF]"
                    : "border-[#DCE6F2] text-[#52627A]",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-[#075DFF] hover:underline"
                      >
                        {order.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="mt-1 text-[11px] text-[#52627A]">
                        {order.customerMobile}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{order.service}</p>
                      <p className="mt-1 text-[11px] text-[#52627A]">
                        {order.itemCount} items
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(order.pickupAt)}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          order.paymentStatus === "Paid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{order.amount.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-[13px] text-[#52627A]"
                  >
                    No matching orders.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminOrderDetails({ initialOrder }: { initialOrder: AdminOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<PortalOrderStatus | null>(null);
  const nextStatuses = allowedOrderTransitions[order.status];

  async function updateStatus(status: PortalOrderStatus) {
    setSaving(status);
    const response = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    const data = (await response.json()) as {
      order?: AdminOrder;
      message?: string;
    };
    setSaving(null);
    if (!response.ok || !data.order) {
      toast.error(data.message ?? "Unable to update order");
      return;
    }
    setOrder(data.order);
    setNote("");
    toast.success(`Order marked ${status}`);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="text-[12px] font-medium text-[#075DFF] hover:underline"
          >
            Back to Orders
          </Link>
          <span className="text-[#A7B4C7]">/</span>
          <span className="text-[13px] font-semibold">{order.id}</span>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <Card>
            <CardHeader className="p-4 font-semibold">Order Items</CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.unitPrice}</TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.quantity * item.unitPrice}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Total
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{order.amount.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 font-semibold">Order Timeline</CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              {order.timeline.map((event, index) => (
                <div key={`${event.status}-${event.createdAt}`} className="flex gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF2FF] text-[10px] font-semibold text-[#075DFF]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium">{event.status}</p>
                    <p className="mt-1 text-[11px] text-[#52627A]">
                      {formatDate(event.createdAt)}
                      {event.note ? ` · ${event.note}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <Card>
            <CardHeader className="p-4 font-semibold">Customer</CardHeader>
            <CardContent className="space-y-2 p-4 pt-0 text-[12px]">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-[#52627A]">{order.customerMobile}</p>
              <p className="break-all text-[#52627A]">{order.customerEmail}</p>
              <p className="border-t border-[#E8EEF6] pt-3 text-[#52627A]">
                {order.address}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 font-semibold">Pickup and Payment</CardHeader>
            <CardContent className="grid grid-cols-[120px_1fr] gap-y-2 p-4 pt-0 text-[12px]">
              <span className="text-[#52627A]">Pickup</span>
              <span>{formatDate(order.pickupAt)}</span>
              <span className="text-[#52627A]">Service</span>
              <span>{order.service}</span>
              <span className="text-[#52627A]">Payment</span>
              <span>{order.paymentStatus}</span>
              <span className="text-[#52627A]">Method</span>
              <span className="capitalize">{order.paymentMethod}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 font-semibold">Update Status</CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              {nextStatuses.length ? (
                <>
                  <Input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={180}
                    placeholder="Note (optional)"
                  />
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={status === "Cancelled" ? "outline" : "default"}
                        className={
                          status === "Cancelled"
                            ? "border-red-200 text-red-700"
                            : "bg-[#075DFF]"
                        }
                        disabled={saving !== null}
                        onClick={() => updateStatus(status)}
                      >
                        {saving === status ? "Saving..." : `Mark ${status}`}
                      </Button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[12px] text-[#52627A]">
                  This order is {order.status.toLowerCase()}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

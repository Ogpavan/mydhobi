"use client";

import {
  CheckCircle2,
  Search,
  Truck,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  DeliveryStats,
  DeliveryStatus,
  DeliveryTask,
} from "@/lib/deliveries";
import type { PickupRider } from "@/lib/pickups";
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

const statuses: Array<DeliveryStatus | "All"> = [
  "All",
  "Ready",
  "Assigned",
  "Out for Delivery",
  "Delivered",
  "Failed",
];

const statusTone: Record<DeliveryStatus, string> = {
  Ready: "border-blue-200 bg-blue-50 text-blue-700",
  Assigned: "border-violet-200 bg-violet-50 text-violet-700",
  "Out for Delivery": "border-orange-200 bg-orange-50 text-orange-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-red-200 bg-red-50 text-red-700",
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

export function AdminDeliveries({
  initialDeliveries,
  riders,
  stats,
}: {
  initialDeliveries: DeliveryTask[];
  riders: PickupRider[];
  stats: DeliveryStats;
}) {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<DeliveryStatus | "All">("All");
  const [savingId, setSavingId] = useState("");

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      const matchesSearch =
        !search ||
        `${delivery.orderId} ${delivery.customerName} ${delivery.customerMobile} ${delivery.address} ${delivery.riderName ?? ""}`
          .toLowerCase()
          .includes(search);
      return matchesSearch && (status === "All" || delivery.status === status);
    });
  }, [deliveries, query, status]);

  async function updateDelivery(
    delivery: DeliveryTask,
    change: { riderId?: string; status?: DeliveryStatus },
  ) {
    setSavingId(delivery.id);
    const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const data = (await response.json()) as {
      delivery?: DeliveryTask;
      message?: string;
    };
    setSavingId("");
    if (!response.ok || !data.delivery) {
      toast.error(data.message ?? "Unable to update delivery");
      return;
    }
    setDeliveries((current) =>
      current.map((item) =>
        item.id === delivery.id ? data.delivery! : item,
      ),
    );
    toast.success("Delivery updated");
  }

  function nextAction(delivery: DeliveryTask) {
    if (delivery.status === "Assigned") {
      return { label: "Send Out", status: "Out for Delivery" as const };
    }
    if (delivery.status === "Out for Delivery") {
      return { label: "Delivered", status: "Delivered" as const };
    }
    if (delivery.status === "Failed") {
      return { label: "Retry", status: "Ready" as const };
    }
    return null;
  }

  const cards = [
    { label: "Today", value: stats.today, icon: Truck },
    { label: "Pending", value: stats.pending, icon: Truck },
    { label: "Unassigned", value: stats.unassigned, icon: UserRoundCheck },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex h-[88px] items-center gap-3 p-4">
              <Icon className="h-7 w-7 text-[#075DFF]" />
              <div>
                <p className="text-[12px] text-[#52627A]">{label}</p>
                <p className="mt-1 text-[22px] font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="space-y-3 p-4">
          <label className="relative block max-w-[400px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
            <span className="sr-only">Search deliveries</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search order, customer, rider, or area"
              className="pl-9"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {statuses.map((item) => (
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
                <TableHead>Delivery Time</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((delivery) => {
                  const action = nextAction(delivery);
                  return (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${delivery.orderId}`}
                          className="font-medium text-[#075DFF] hover:underline"
                        >
                          {delivery.orderId}
                        </Link>
                        <p className="mt-1 text-[11px] text-[#52627A]">
                          {delivery.service}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{delivery.customerName}</p>
                        <p className="mt-1 text-[11px] text-[#52627A]">
                          {delivery.customerMobile}
                        </p>
                      </TableCell>
                      <TableCell>{formatDate(delivery.scheduledAt)}</TableCell>
                      <TableCell>
                        <p
                          className="max-w-[190px] truncate"
                          title={delivery.address}
                        >
                          {delivery.address}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            delivery.paymentStatus === "Paid"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {delivery.paymentStatus} · ₹{delivery.amount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.status === "Delivered" ? (
                          delivery.riderName ?? "Not assigned"
                        ) : (
                          <select
                            aria-label={`Assign rider for ${delivery.orderId}`}
                            value={delivery.riderId ?? ""}
                            disabled={savingId === delivery.id}
                            onChange={(event) => {
                              if (event.target.value) {
                                updateDelivery(delivery, {
                                  riderId: event.target.value,
                                });
                              }
                            }}
                            className="h-9 min-w-[150px] rounded border border-[#DCE6F2] bg-white px-2 text-[12px]"
                          >
                            <option value="">Assign rider</option>
                            {riders.map((rider) => (
                              <option key={rider.id} value={rider.id}>
                                {rider.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium",
                            statusTone[delivery.status],
                          )}
                        >
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {action ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === delivery.id}
                            onClick={() =>
                              updateDelivery(delivery, {
                                status: action.status,
                              })
                            }
                          >
                            {savingId === delivery.id
                              ? "Saving..."
                              : action.label}
                          </Button>
                        ) : delivery.status === "Ready" ? (
                          <span className="text-[11px] text-[#52627A]">
                            Assign rider
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#52627A]">Done</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-[13px] text-[#52627A]"
                  >
                    No matching deliveries.
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

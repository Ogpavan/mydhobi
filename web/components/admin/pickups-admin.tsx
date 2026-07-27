"use client";

import { Bike, CheckCircle2, Search, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  PickupRider,
  PickupStats,
  PickupStatus,
  PickupTask,
} from "@/lib/pickups";
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

const statuses: Array<PickupStatus | "All"> = [
  "All",
  "Scheduled",
  "Assigned",
  "Out for Pickup",
  "Completed",
  "Failed",
];

const statusTone: Record<PickupStatus, string> = {
  Scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  Assigned: "border-violet-200 bg-violet-50 text-violet-700",
  "Out for Pickup": "border-orange-200 bg-orange-50 text-orange-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

export function AdminPickups({
  initialPickups,
  riders,
  stats,
}: {
  initialPickups: PickupTask[];
  riders: PickupRider[];
  stats: PickupStats;
}) {
  const [pickups, setPickups] = useState(initialPickups);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PickupStatus | "All">("All");
  const [savingId, setSavingId] = useState("");

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return pickups.filter((pickup) => {
      const matchesSearch =
        !search ||
        `${pickup.orderId} ${pickup.customerName} ${pickup.customerMobile} ${pickup.address} ${pickup.riderName ?? ""}`
          .toLowerCase()
          .includes(search);
      return matchesSearch && (status === "All" || pickup.status === status);
    });
  }, [pickups, query, status]);

  async function updatePickup(
    pickup: PickupTask,
    change: { riderId?: string; status?: PickupStatus },
  ) {
    setSavingId(pickup.id);
    const response = await fetch(`/api/admin/pickups/${pickup.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    const data = (await response.json()) as {
      pickup?: PickupTask;
      message?: string;
    };
    setSavingId("");
    if (!response.ok || !data.pickup) {
      toast.error(data.message ?? "Unable to update pickup");
      return;
    }
    setPickups((current) =>
      current.map((item) => (item.id === pickup.id ? data.pickup! : item)),
    );
    toast.success("Pickup updated");
  }

  function nextAction(pickup: PickupTask) {
    if (pickup.status === "Assigned") {
      return { label: "Start Pickup", status: "Out for Pickup" as const };
    }
    if (pickup.status === "Out for Pickup") {
      return { label: "Complete", status: "Completed" as const };
    }
    if (pickup.status === "Failed") {
      return { label: "Retry", status: "Scheduled" as const };
    }
    return null;
  }

  const cards = [
    { label: "Today", value: stats.today, icon: Bike },
    { label: "Pending", value: stats.pending, icon: Bike },
    { label: "Unassigned", value: stats.unassigned, icon: UserRoundCheck },
    { label: "Completed", value: stats.completed, icon: CheckCircle2 },
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
            <span className="sr-only">Search pickups</span>
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
                <TableHead>Pickup Time</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((pickup) => {
                  const action = nextAction(pickup);
                  return (
                    <TableRow key={pickup.id}>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${pickup.orderId}`}
                          className="font-medium text-[#075DFF] hover:underline"
                        >
                          {pickup.orderId}
                        </Link>
                        <p className="mt-1 text-[11px] text-[#52627A]">
                          {pickup.service}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{pickup.customerName}</p>
                        <p className="mt-1 text-[11px] text-[#52627A]">
                          {pickup.customerMobile}
                        </p>
                      </TableCell>
                      <TableCell>{formatDate(pickup.scheduledAt)}</TableCell>
                      <TableCell>
                        <p className="max-w-[220px] truncate" title={pickup.address}>
                          {pickup.address}
                        </p>
                      </TableCell>
                      <TableCell>
                        {pickup.status === "Completed" ? (
                          pickup.riderName
                        ) : (
                          <select
                            aria-label={`Assign rider for ${pickup.orderId}`}
                            value={pickup.riderId ?? ""}
                            disabled={savingId === pickup.id}
                            onChange={(event) => {
                              if (event.target.value) {
                                updatePickup(pickup, {
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
                          className={cn("font-medium", statusTone[pickup.status])}
                        >
                          {pickup.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {action ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === pickup.id}
                            onClick={() =>
                              updatePickup(pickup, { status: action.status })
                            }
                          >
                            {savingId === pickup.id ? "Saving..." : action.label}
                          </Button>
                        ) : pickup.status === "Scheduled" ? (
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
                    colSpan={7}
                    className="h-32 text-center text-[13px] text-[#52627A]"
                  >
                    No matching pickups.
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

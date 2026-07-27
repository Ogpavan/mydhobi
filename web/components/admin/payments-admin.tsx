"use client";

import { IndianRupee, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type {
  PaymentRecord,
  PaymentStats,
  PaymentStatus,
} from "@/lib/payments";
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

const statuses: Array<PaymentStatus | "All"> = [
  "All",
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
];

const statusTone: Record<PaymentStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Failed: "border-red-200 bg-red-50 text-red-700",
  Refunded: "border-violet-200 bg-violet-50 text-violet-700",
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

export function AdminPayments({
  initialPayments,
  stats,
}: {
  initialPayments: PaymentRecord[];
  stats: PaymentStats;
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "All">("All");
  const [savingId, setSavingId] = useState("");

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesSearch =
        !search ||
        `${payment.reference} ${payment.orderId ?? ""} ${payment.customerName} ${payment.customerMobile}`
          .toLowerCase()
          .includes(search);
      return matchesSearch && (status === "All" || payment.status === status);
    });
  }, [payments, query, status]);

  async function changeStatus(
    payment: PaymentRecord,
    nextStatus: PaymentStatus,
  ) {
    if (
      nextStatus === "Refunded" &&
      !window.confirm(
        `Refund ₹${payment.amount.toFixed(2)} to the customer's wallet?`,
      )
    ) {
      return;
    }
    setSavingId(payment.id);
    const response = await fetch(`/api/admin/payments/${payment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    const data = (await response.json()) as {
      payment?: PaymentRecord;
      message?: string;
    };
    setSavingId("");
    if (!response.ok || !data.payment) {
      toast.error(data.message ?? "Unable to update payment");
      return;
    }
    setPayments((current) =>
      current.map((item) =>
        item.id === payment.id ? data.payment! : item,
      ),
    );
    toast.success(`Payment marked ${nextStatus}`);
  }

  const cards = [
    {
      label: "Collected",
      value: `₹${stats.collected.toLocaleString("en-IN")}`,
    },
    {
      label: "Pending",
      value: `₹${stats.pending.toLocaleString("en-IN")}`,
    },
    {
      label: "Refunded",
      value: `₹${stats.refunded.toLocaleString("en-IN")}`,
    },
    {
      label: "Transactions",
      value: stats.transactions.toLocaleString("en-IN"),
    },
  ];

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex h-[88px] items-center gap-3 p-4">
              <IndianRupee className="h-7 w-7 text-[#6D28D9]" />
              <div>
                <p className="text-[12px] text-[#52627A]">{card.label}</p>
                <p className="mt-1 text-[22px] font-semibold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="space-y-3 p-4">
          <label className="relative block max-w-[400px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
            <span className="sr-only">Search payments</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reference, order, customer, or mobile"
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
                <TableHead>Reference</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <p className="font-medium">{payment.reference}</p>
                      {payment.orderId ? (
                        <Link
                          href={`/admin/orders/${payment.orderId}`}
                          className="mt-1 block text-[11px] text-[#075DFF] hover:underline"
                        >
                          {payment.orderId}
                        </Link>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{payment.customerName}</p>
                      <p className="mt-1 text-[11px] text-[#52627A]">
                        {payment.customerMobile}
                      </p>
                    </TableCell>
                    <TableCell>{payment.kind}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          statusTone[payment.status],
                        )}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.status === "Pending" ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            disabled={savingId === payment.id}
                            onClick={() => changeStatus(payment, "Paid")}
                            className="bg-[#075DFF]"
                          >
                            Collect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === payment.id}
                            onClick={() => changeStatus(payment, "Failed")}
                          >
                            Fail
                          </Button>
                        </div>
                      ) : payment.status === "Paid" &&
                        payment.kind === "Order" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === payment.id}
                          onClick={() => changeStatus(payment, "Refunded")}
                        >
                          Refund
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#52627A]">Done</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="h-32 text-center text-[13px] text-[#52627A]"
                  >
                    No matching payments.
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

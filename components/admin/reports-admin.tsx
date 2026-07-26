"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import type { ReportData, ReportRange } from "@/lib/reports";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const ranges: Array<{ value: ReportRange; label: string }> = [
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
  { value: 365, label: "1 Year" },
];

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function AdminReports({ initialReport }: { initialReport: ReportData }) {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const maxOrders = Math.max(1, ...report.dailyOrders.map((day) => day.orders));
  const maxServiceOrders = Math.max(
    1,
    ...report.topServices.map((service) => service.orders),
  );

  async function changeRange(range: ReportRange) {
    setLoading(true);
    const response = await fetch(`/api/admin/reports?range=${range}`);
    const data = (await response.json()) as {
      report?: ReportData;
      message?: string;
    };
    setLoading(false);
    if (!response.ok || !data.report) {
      toast.error(data.message ?? "Unable to load report");
      return;
    }
    setReport(data.report);
  }

  const summary = [
    {
      label: "Revenue",
      value: `₹${report.summary.revenue.toLocaleString("en-IN")}`,
    },
    {
      label: "Orders",
      value: report.summary.orders.toLocaleString("en-IN"),
    },
    {
      label: "Customers",
      value: report.summary.customers.toLocaleString("en-IN"),
    },
    {
      label: "Average Order",
      value: `₹${report.summary.averageOrder.toFixed(0)}`,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto">
          {ranges.map((range) => (
            <button
              key={range.value}
              type="button"
              disabled={loading}
              onClick={() => changeRange(range.value)}
              className={cn(
                "whitespace-nowrap rounded border px-3 py-2 text-[11px]",
                report.range === range.value
                  ? "border-[#075DFF] bg-[#EEF5FF] text-[#075DFF]"
                  : "border-[#DCE6F2] bg-white text-[#52627A]",
              )}
            >
              {range.label}
            </button>
          ))}
        </div>
        <Button asChild variant="outline">
          <a
            href={`/api/admin/reports/export?range=${report.range}`}
            download
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </Button>
      </div>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-[12px] text-[#52627A]">{item.label}</p>
              <p className="mt-2 text-[24px] font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="p-4 font-semibold">Orders by Day</CardHeader>
          <CardContent className="overflow-x-auto p-4 pt-0">
            {report.dailyOrders.length ? (
              <div
                className="flex h-[240px] items-end gap-2"
                style={{
                  minWidth: `${Math.max(560, report.dailyOrders.length * 42)}px`,
                }}
              >
                {report.dailyOrders.map((day) => (
                  <div
                    key={day.date}
                    className="flex h-full min-w-8 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] font-medium">{day.orders}</span>
                    <div
                      className="w-full max-w-8 rounded-t bg-[#075DFF]"
                      style={{
                        height: `${Math.max(8, (day.orders / maxOrders) * 160)}px`,
                      }}
                      title={`₹${day.revenue.toLocaleString("en-IN")}`}
                    />
                    <span className="whitespace-nowrap text-[9px] text-[#52627A]">
                      {shortDate(day.date)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-20 text-center text-[12px] text-[#52627A]">
                No orders in this period.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 font-semibold">Top Services</CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            {report.topServices.map((service) => (
              <div key={service.service}>
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="truncate">{service.service}</span>
                  <strong>{service.orders}</strong>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[#E8EEF6]">
                  <div
                    className="h-full rounded-full bg-[#6D28D9]"
                    style={{
                      width: `${(service.orders / maxServiceOrders) * 100}%`,
                    }}
                  />
                </div>
                <p className="mt-1 text-[9px] text-[#52627A]">
                  ₹{service.revenue.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
            {!report.topServices.length ? (
              <p className="py-16 text-center text-[12px] text-[#52627A]">
                No service data.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader className="p-4 font-semibold">Order Status</CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.orderStatuses.map((item) => (
                  <TableRow key={item.status}>
                    <TableCell>
                      <Badge variant="outline">{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.orders}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 font-semibold">Payment Methods</CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Payments</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.paymentMethods.map((item) => (
                  <TableRow key={item.method}>
                    <TableCell className="capitalize">{item.method}</TableCell>
                    <TableCell className="text-right">
                      {item.transactions}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{item.amount.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

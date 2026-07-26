"use client";

import { Download, Search, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WalletReportData } from "@/lib/wallet-report";

type TransactionType = "all" | "credit" | "debit";
type ReportRange = "all" | "7" | "30" | "90";

const selectClassName =
  "h-9 rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#31405A] shadow-sm outline-none focus:border-[#075DFF] focus:ring-1 focus:ring-[#075DFF]/20";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

export function WalletReportView({ report }: { report: WalletReportData }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<TransactionType>("all");
  const [range, setRange] = useState<ReportRange>("30");

  const transactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    const cutoff = range === "all"
      ? null
      : Date.now() - Number(range) * 24 * 60 * 60 * 1000;

    return report.transactions.filter((transaction) => {
      if (type === "credit" && transaction.amount < 0) return false;
      if (type === "debit" && transaction.amount >= 0) return false;
      if (cutoff !== null && new Date(transaction.createdAt).getTime() < cutoff) {
        return false;
      }
      return !query || [
        transaction.customerName,
        transaction.mobile,
        transaction.label,
        transaction.reason,
        transaction.addedBy,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [range, report.transactions, search, type]);

  const visibleCredit = transactions.reduce(
    (total, transaction) =>
      total + (transaction.amount > 0 ? transaction.amount : 0),
    0,
  );
  const visibleDebit = Math.abs(transactions.reduce(
    (total, transaction) =>
      total + (transaction.amount < 0 ? transaction.amount : 0),
    0,
  ));

  function exportCsv() {
    const headers = [
      "Date",
      "Customer",
      "Mobile",
      "Details",
      "Reason",
      "Added By",
      "Credit",
      "Debit",
    ];
    const rows = transactions.map((transaction) => [
      new Date(transaction.createdAt).toLocaleString("en-IN"),
      transaction.customerName,
      transaction.mobile,
      transaction.label,
      transaction.reason,
      transaction.addedBy,
      transaction.amount >= 0 ? transaction.amount.toFixed(2) : "",
      transaction.amount < 0 ? Math.abs(transaction.amount).toFixed(2) : "",
    ]);
    const csv = [
      headers.map(csvCell).join(","),
      ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "wallet-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const summary = [
    { label: "Wallet Balance", value: money(report.summary.currentBalance) },
    { label: "Total Added", value: money(report.summary.totalCredited) },
    { label: "Total Deducted", value: money(report.summary.totalDeducted) },
    {
      label: "Wallet Customers",
      value: report.summary.walletCustomers.toLocaleString("en-IN"),
    },
  ];

  return (
    <div className="space-y-3 py-4">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <p className="text-[12px] text-[#52627A]">{item.label}</p>
              <p className="mt-2 text-[22px] font-semibold tabular-nums text-[#071333]">
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE6F2] p-4">
            <div className="relative min-w-[210px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search customer or reason"
                aria-label="Search wallet report"
              />
            </div>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as TransactionType)}
              className={selectClassName}
              aria-label="Transaction type"
            >
              <option value="all">All Types</option>
              <option value="credit">Added</option>
              <option value="debit">Deducted</option>
            </select>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as ReportRange)}
              className={selectClassName}
              aria-label="Date range"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="all">All Time</option>
            </select>
            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download />
              Export CSV
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E7EDF5] bg-[#F8FAFD] px-4 py-2 text-[11px] text-[#52627A]">
            <span>{transactions.length.toLocaleString("en-IN")} transactions</span>
            <span className="flex gap-4">
              <span>
                Added: <strong className="text-green-700">{money(visibleCredit)}</strong>
              </span>
              <span>
                Deducted: <strong className="text-red-700">{money(visibleDebit)}</strong>
              </span>
            </span>
          </div>

          <Table className="min-w-[940px]">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Debit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap text-[12px] text-[#52627A]">
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(transaction.createdAt))}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-[#071333]">
                        {transaction.customerName}
                      </p>
                      <p className="mt-1 text-xs text-[#718198]">
                        {transaction.mobile}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[190px]">
                      <p className="break-words">{transaction.label}</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {transaction.source === "admin" ? "Admin" : "App"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[220px] break-words text-[#52627A]">
                      {transaction.reason || "—"}
                    </TableCell>
                    <TableCell>{transaction.addedBy}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-green-700">
                      {transaction.amount >= 0 ? money(transaction.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-red-700">
                      {transaction.amount < 0
                        ? money(Math.abs(transaction.amount))
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-[#718198]"
                  >
                    <WalletCards className="mx-auto mb-2 h-5 w-5" />
                    No wallet transactions found
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

"use client";

import { Download, Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import type {
  OperationalReportColumn,
  OperationalReportData,
  OperationalReportRange,
  ReportValue,
} from "@/lib/operational-reports";
import { cn } from "@/lib/utils";

const ranges: Array<{ value: OperationalReportRange; label: string }> = [
  { value: 7, label: "7 Days" },
  { value: 30, label: "30 Days" },
  { value: 90, label: "90 Days" },
  { value: 365, label: "1 Year" },
];

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayValue(value: ReportValue, column: OperationalReportColumn) {
  if (value === null || value === "") return "—";
  if (column.format === "money") return money(Number(value));
  if (column.format === "number") {
    return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 3 });
  }
  if (column.format === "date") {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(String(value)));
  }
  return String(value);
}

function statusClass(value: string) {
  const normalized = value.toLowerCase();
  if (
    normalized.includes("complete") ||
    normalized.includes("deliver") ||
    normalized === "paid" ||
    normalized === "active" ||
    normalized === "resolved"
  ) {
    return "border-green-200 bg-green-50 text-green-700";
  }
  if (
    normalized.includes("fail") ||
    normalized.includes("cancel") ||
    normalized === "inactive" ||
    normalized.includes("low stock")
  ) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function OperationalReportView({
  initialReport,
}: {
  initialReport: OperationalReportData;
}) {
  const [report, setReport] = useState(initialReport);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return report.rows;
    return report.rows.filter((row) =>
      Object.values(row.values).some((value) =>
        String(value ?? "").toLowerCase().includes(query)),
    );
  }, [report.rows, search]);

  async function changeRange(range: OperationalReportRange) {
    if (range === report.range) return;
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reports/${report.key}?range=${range}`,
      );
      const data = await response.json() as {
        report?: OperationalReportData;
        message?: string;
      };
      if (!response.ok || !data.report) {
        toast.error(data.message ?? "Unable to load report.");
        return;
      }
      setReport(data.report);
      setSearch("");
    } catch {
      toast.error("Unable to load report right now.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const headers = report.columns.map((column) => column.label);
    const lines = rows.map((row) =>
      report.columns.map((column) =>
        csvCell(displayValue(row.values[column.key], column))).join(","),
    );
    const csv = [headers.map(csvCell).join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.key}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3 py-4">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {report.metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <p className="text-[12px] text-[#52627A]">{metric.label}</p>
              <p className="mt-2 text-[22px] font-semibold tabular-nums text-[#071333]">
                {metric.format === "money"
                  ? money(metric.value)
                  : metric.value.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE6F2] p-4">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                placeholder="Search report"
                aria-label={`Search ${report.title}`}
              />
            </div>
            {report.supportsRange ? (
              <div className="flex gap-1 overflow-x-auto">
                {ranges.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    disabled={loading}
                    onClick={() => void changeRange(range.value)}
                    className={cn(
                      "h-9 whitespace-nowrap rounded border px-3 text-[11px]",
                      report.range === range.value
                        ? "border-[#075DFF] bg-[#EEF5FF] text-[#075DFF]"
                        : "border-[#DCE6F2] bg-white text-[#52627A]",
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            ) : null}
            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download />
              Export CSV
            </Button>
          </div>

          <div className="flex items-center justify-between border-b border-[#E7EDF5] bg-[#F8FAFD] px-4 py-2 text-[11px] text-[#52627A]">
            <span>{rows.length.toLocaleString("en-IN")} records</span>
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading...
              </span>
            ) : null}
          </div>

          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                {report.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={column.align === "right" ? "text-right" : undefined}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.id}>
                    {report.columns.map((column) => {
                      const value = row.values[column.key];
                      return (
                        <TableCell
                          key={column.key}
                          className={cn(
                            "max-w-[240px] break-words",
                            column.align === "right" && "text-right tabular-nums",
                            column.format === "date" && "whitespace-nowrap text-[12px] text-[#52627A]",
                          )}
                        >
                          {column.format === "status" ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "whitespace-nowrap capitalize",
                                statusClass(String(value ?? "")),
                              )}
                            >
                              {displayValue(value, column)}
                            </Badge>
                          ) : (
                            displayValue(value, column)
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={report.columns.length}
                    className="h-32 text-center text-[#718198]"
                  >
                    No records found
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

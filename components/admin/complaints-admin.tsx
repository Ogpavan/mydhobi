"use client";

import { CircleCheck, Clock3, MessageSquareText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  ComplaintRecord,
  ComplaintStats,
  ComplaintStatus,
} from "@/lib/support";
import { cn } from "@/lib/utils";

const complaintStatuses: ComplaintStatus[] = [
  "Open",
  "In Progress",
  "Resolved",
];
const filters: Array<ComplaintStatus | "All"> = [
  "All",
  ...complaintStatuses,
];

const statusTone: Record<ComplaintStatus, string> = {
  Open: "border-red-200 bg-red-50 text-red-700",
  "In Progress": "border-amber-200 bg-amber-50 text-amber-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
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

export function AdminComplaints({
  initialComplaints,
  initialStats,
}: {
  initialComplaints: ComplaintRecord[];
  initialStats: ComplaintStats;
}) {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [filter, setFilter] = useState<ComplaintStatus | "All">("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ComplaintRecord | null>(null);
  const [editStatus, setEditStatus] = useState<ComplaintStatus>("Open");
  const [response, setResponse] = useState("");
  const [saving, setSaving] = useState(false);

  const stats = useMemo(
    () => ({
      open: complaints.filter((item) => item.status === "Open").length,
      inProgress: complaints.filter((item) => item.status === "In Progress")
        .length,
      resolved: complaints.filter((item) => item.status === "Resolved").length,
      total: complaints.length,
    }),
    [complaints],
  );
  const shownStats = complaints.length ? stats : initialStats;

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return complaints.filter((complaint) => {
      const matches =
        !search ||
        `${complaint.reference} ${complaint.customerName} ${complaint.customerMobile} ${complaint.subject}`
          .toLowerCase()
          .includes(search);
      return matches && (filter === "All" || complaint.status === filter);
    });
  }, [complaints, filter, query]);

  function openComplaint(complaint: ComplaintRecord) {
    setSelected(complaint);
    setEditStatus(complaint.status);
    setResponse(complaint.response);
  }

  async function saveComplaint() {
    if (!selected) return;
    if (editStatus === "Resolved" && !response.trim()) {
      toast.error("Add a reply before resolving the complaint");
      return;
    }
    setSaving(true);
    const request = await fetch(`/api/admin/complaints/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: editStatus, response }),
    });
    const data = (await request.json()) as {
      complaint?: ComplaintRecord;
      message?: string;
    };
    setSaving(false);
    if (!request.ok || !data.complaint) {
      toast.error(data.message ?? "Unable to update complaint");
      return;
    }
    setComplaints((current) =>
      current.map((item) =>
        item.id === data.complaint!.id ? data.complaint! : item,
      ),
    );
    setSelected(null);
    toast.success("Complaint updated");
  }

  const cards = [
    { label: "Open", value: shownStats.open, icon: MessageSquareText },
    { label: "In Progress", value: shownStats.inProgress, icon: Clock3 },
    { label: "Resolved", value: shownStats.resolved, icon: CircleCheck },
    { label: "Total", value: shownStats.total, icon: MessageSquareText },
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
          <label className="relative block max-w-[420px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
            <span className="sr-only">Search complaints</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search complaint, customer, or mobile"
              className="pl-9"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={cn(
                  "whitespace-nowrap rounded border px-3 py-1.5 text-[11px]",
                  filter === item
                    ? "border-[#075DFF] bg-[#EEF5FF] text-[#075DFF]"
                    : "border-[#DCE6F2] text-[#52627A]",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Complaint</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium">
                      {complaint.reference}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{complaint.customerName}</p>
                      <p className="mt-1 text-[11px] text-[#52627A]">
                        {complaint.customerMobile}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <p className="truncate font-medium">{complaint.subject}</p>
                      <p className="mt-1 truncate text-[11px] text-[#52627A]">
                        {complaint.details || "No details"}
                      </p>
                    </TableCell>
                    <TableCell>{formatDate(complaint.createdAt)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusTone[complaint.status]}
                      >
                        {complaint.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openComplaint(complaint)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-32 text-center text-[#52627A]"
                  >
                    No complaints found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{selected?.reference}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] text-[#52627A]">Customer</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {selected.customerName}
                  </p>
                  <p className="text-[11px] text-[#52627A]">
                    {selected.customerMobile}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#52627A]">Raised on</p>
                  <p className="mt-1 text-[13px] font-medium">
                    {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#52627A]">Issue</p>
                <p className="mt-1 text-[13px] font-medium">
                  {selected.subject}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-[12px] leading-5 text-[#385071]">
                  {selected.details || "No details added."}
                </p>
              </div>
              <label className="block text-[12px] font-medium">
                Status
                <select
                  value={editStatus}
                  onChange={(event) =>
                    setEditStatus(event.target.value as ComplaintStatus)
                  }
                  className="mt-1.5 h-10 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] outline-none focus:border-[#075DFF]"
                >
                  {complaintStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="block text-[12px] font-medium">
                Reply to customer
                <textarea
                  value={response}
                  onChange={(event) =>
                    setResponse(event.target.value.slice(0, 1000))
                  }
                  rows={4}
                  placeholder="Write a short reply"
                  className="mt-1.5 w-full resize-none rounded border border-[#DCE6F2] px-3 py-2 text-[12px] outline-none focus:border-[#075DFF]"
                />
                <span className="mt-1 block text-right text-[10px] text-[#52627A]">
                  {response.length}/1000
                </span>
              </label>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={saving}
                  onClick={saveComplaint}
                  className="bg-[#075DFF]"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

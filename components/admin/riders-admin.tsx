"use client";

import { Plus, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";

import type {
  RiderDetails,
  RiderRecord,
  RiderStatus,
} from "@/lib/riders";
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
import { cn } from "@/lib/utils";

const statusTone: Record<RiderStatus, string> = {
  "On Duty": "border-blue-200 bg-blue-50 text-blue-700",
  Available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Off Duty": "border-slate-200 bg-slate-50 text-slate-600",
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

function RiderStatusBadge({ status }: { status: RiderStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusTone[status])}>
      {status}
    </Badge>
  );
}

export function AdminRiders({ initialRiders }: { initialRiders: RiderRecord[] }) {
  const [riders, setRiders] = useState(initialRiders);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");

  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return riders.filter(
      (rider) =>
        !search ||
        `${rider.name} ${rider.mobile} ${rider.area}`
          .toLowerCase()
          .includes(search),
    );
  }, [query, riders]);

  async function createRider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        mobile: form.get("mobile"),
        area: form.get("area"),
        status: form.get("status"),
      }),
    });
    const data = (await response.json()) as {
      rider?: RiderRecord;
      message?: string;
    };
    setSaving(false);
    if (!response.ok || !data.rider) {
      toast.error(data.message ?? "Unable to add rider");
      return;
    }
    setRiders((current) => [...current, data.rider!]);
    setDialogOpen(false);
    toast.success("Rider added");
  }

  async function updateStatus(rider: RiderRecord, status: RiderStatus) {
    setSavingId(rider.id);
    const response = await fetch(`/api/admin/riders/${rider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as {
      rider?: RiderRecord;
      message?: string;
    };
    setSavingId("");
    if (!response.ok || !data.rider) {
      toast.error(data.message ?? "Unable to update rider");
      return;
    }
    setRiders((current) =>
      current.map((item) =>
        item.id === rider.id
          ? { ...item, status: data.rider!.status }
          : item,
      ),
    );
    toast.success("Rider status updated");
  }

  const cards = [
    { label: "Total Riders", value: riders.length },
    {
      label: "On Duty",
      value: riders.filter((rider) => rider.status === "On Duty").length,
    },
    {
      label: "Available",
      value: riders.filter((rider) => rider.status === "Available").length,
    },
    {
      label: "Off Duty",
      value: riders.filter((rider) => rider.status === "Off Duty").length,
    },
  ];

  return (
    <div className="space-y-3">
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex h-[88px] items-center gap-3 p-4">
              <UserRound className="h-7 w-7 text-[#075DFF]" />
              <div>
                <p className="text-[12px] text-[#52627A]">{card.label}</p>
                <p className="mt-1 text-[22px] font-semibold">{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 p-4">
          <label className="relative block w-full max-w-[400px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52627A]" />
            <span className="sr-only">Search riders</span>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search rider, mobile, or area"
              className="pl-9"
            />
          </label>
          <Button
            onClick={() => setDialogOpen(true)}
            className="shrink-0 bg-[#075DFF]"
          >
            <Plus className="h-4 w-4" />
            Add Rider
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Today Jobs</TableHead>
                <TableHead>Active Jobs</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length ? (
                visible.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell className="font-medium">{rider.name}</TableCell>
                    <TableCell>{rider.mobile}</TableCell>
                    <TableCell>{rider.area}</TableCell>
                    <TableCell>{rider.todayJobs}</TableCell>
                    <TableCell>{rider.activeJobs}</TableCell>
                    <TableCell>
                      <select
                        aria-label={`Status for ${rider.name}`}
                        value={rider.status}
                        disabled={savingId === rider.id}
                        onChange={(event) =>
                          updateStatus(rider, event.target.value as RiderStatus)
                        }
                        className="h-9 rounded border border-[#DCE6F2] bg-white px-2 text-[12px]"
                      >
                        <option>Available</option>
                        <option>On Duty</option>
                        <option>Off Duty</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/riders/${rider.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-32 text-center text-[13px] text-[#52627A]"
                  >
                    No matching riders.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Rider</DialogTitle>
          </DialogHeader>
          <form onSubmit={createRider} className="space-y-3 p-4">
            <label className="block text-[12px] font-medium">
              Rider Name
              <Input
                name="name"
                required
                maxLength={100}
                className="mt-2"
                placeholder="Enter rider name"
              />
            </label>
            <label className="block text-[12px] font-medium">
              Mobile Number
              <Input
                name="mobile"
                required
                inputMode="numeric"
                pattern="[0-9]{10}"
                minLength={10}
                maxLength={10}
                className="mt-2"
                placeholder="10-digit mobile number"
              />
            </label>
            <label className="block text-[12px] font-medium">
              Area
              <Input
                name="area"
                required
                maxLength={100}
                className="mt-2"
                placeholder="Service area"
              />
            </label>
            <label className="block text-[12px] font-medium">
              Status
              <select
                name="status"
                className="mt-2 h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px]"
              >
                <option>Available</option>
                <option>On Duty</option>
                <option>Off Duty</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button disabled={saving} className="bg-[#075DFF]">
                {saving ? "Saving..." : "Add Rider"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AdminRiderDetails({
  initialRider,
}: {
  initialRider: RiderDetails;
}) {
  const [rider, setRider] = useState(initialRider);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/riders/${rider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        mobile: form.get("mobile"),
        area: form.get("area"),
        status: form.get("status"),
      }),
    });
    const data = (await response.json()) as {
      rider?: RiderRecord;
      message?: string;
    };
    setSaving(false);
    if (!response.ok || !data.rider) {
      toast.error(data.message ?? "Unable to update rider");
      return;
    }
    setRider((current) => ({ ...current, ...data.rider! }));
    toast.success("Rider updated");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/riders"
          className="text-[12px] font-medium text-[#075DFF] hover:underline"
        >
          Back to Riders
        </Link>
        <span className="text-[#A7B4C7]">/</span>
        <span className="text-[13px] font-semibold">{rider.name}</span>
      </div>

      <div className="grid gap-3 xl:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader className="p-4 font-semibold">Rider Details</CardHeader>
          <CardContent className="p-4 pt-0">
            <form onSubmit={save} className="space-y-3">
              <label className="block text-[12px] font-medium">
                Rider Name
                <Input
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={rider.name}
                  className="mt-2"
                />
              </label>
              <label className="block text-[12px] font-medium">
                Mobile Number
                <Input
                  name="mobile"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  minLength={10}
                  maxLength={10}
                  defaultValue={rider.mobile}
                  className="mt-2"
                />
              </label>
              <label className="block text-[12px] font-medium">
                Area
                <Input
                  name="area"
                  required
                  maxLength={100}
                  defaultValue={rider.area}
                  className="mt-2"
                />
              </label>
              <label className="block text-[12px] font-medium">
                Status
                <select
                  name="status"
                  defaultValue={rider.status}
                  className="mt-2 h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px]"
                >
                  <option>Available</option>
                  <option>On Duty</option>
                  <option>Off Duty</option>
                </select>
              </label>
              <Button disabled={saving} className="w-full bg-[#075DFF]">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <section className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <p className="text-[12px] text-[#52627A]">Active Jobs</p>
                <p className="mt-2 text-[22px] font-semibold">
                  {rider.activeJobs}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-[12px] text-[#52627A]">Status</p>
                <div className="mt-3">
                  <RiderStatusBadge status={rider.status} />
                </div>
              </CardContent>
            </Card>
          </section>
          <Card>
            <CardHeader className="p-4 font-semibold">Assigned Jobs</CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rider.jobs.length ? (
                    rider.jobs.map((job) => (
                      <TableRow key={`${job.type}-${job.id}`}>
                        <TableCell>{job.type}</TableCell>
                        <TableCell>
                          <Link
                            href={`/admin/orders/${job.orderId}`}
                            className="font-medium text-[#075DFF] hover:underline"
                          >
                            {job.orderId}
                          </Link>
                        </TableCell>
                        <TableCell>{job.customerName}</TableCell>
                        <TableCell>{formatDate(job.scheduledAt)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{job.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-32 text-center text-[13px] text-[#52627A]"
                      >
                        No assigned jobs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

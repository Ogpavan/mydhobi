import { MuiSelect } from "@/components/ui/native-controls";
import { apiFetch } from "@/platform/http";
import Link from "@/platform/navigation";
import { toast } from "@/platform/notifications";
import {
  Pagination,
  Table as MuiDataTable,
  TableContainer as MuiTableContainer,
} from "@mui/material";
import {
  CheckCircle2,
  IndianRupee,
  PackageCheck,
  Printer,
  Plus,
  Search,
  SlidersHorizontal,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import type {
  AdminOrder,
  AdminOrderStats,
  AdminOrderSummary,
} from "@/lib/admin-orders";
import {
  allowedOrderTransitions,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";
import { cn } from "@/lib/utils";

const statusTone: Partial<Record<PortalOrderStatus, string>> = {
  New: "border-blue-200 bg-blue-50 text-blue-700",
  "Pickup Scheduled": "border-blue-200 bg-blue-50 text-blue-700",
  "Rider Assigned": "border-cyan-200 bg-cyan-50 text-cyan-700",
  "Out for Pickup": "border-cyan-200 bg-cyan-50 text-cyan-700",
  "Picked Up": "border-cyan-200 bg-cyan-50 text-cyan-700",
  "Received at Store": "border-amber-200 bg-amber-50 text-amber-700",
  "Inspection in Progress": "border-amber-200 bg-amber-50 text-amber-700",
  "Awaiting Confirmation": "border-amber-200 bg-amber-50 text-amber-700",
  Confirmed: "border-amber-200 bg-amber-50 text-amber-700",
  "In Cleaning": "border-amber-200 bg-amber-50 text-amber-700",
  "Quality Check": "border-violet-200 bg-violet-50 text-violet-700",
  Ready: "border-violet-200 bg-violet-50 text-violet-700",
  "Delivery Assigned": "border-orange-200 bg-orange-50 text-orange-700",
  "Out for Delivery": "border-orange-200 bg-orange-50 text-orange-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};
const orderSurfaceClassName =
  "border border-[#DCE6F2] bg-white shadow-[0_3px_12px_rgba(15,23,42,0.05)]";

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

function localDateTimeValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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
  stores = [],
}: {
  initialOrders: AdminOrderSummary[];
  stats: AdminOrderStats;
  stores?: Array<{ id: string; name: string }>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PortalOrderStatus | "All">("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [storeId, setStoreId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const filteredOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return initialOrders.filter((order) => {
      const matchesSearch =
        !search ||
        `${order.id} ${order.customerName} ${order.customerMobile} ${order.service}`
          .toLowerCase()
          .includes(search);
      const createdAt = new Date(order.createdAt).getTime();
      const start = fromDate
        ? new Date(`${fromDate}T00:00:00`).getTime()
        : Number.NEGATIVE_INFINITY;
      const end = toDate
        ? new Date(`${toDate}T23:59:59.999`).getTime()
        : Number.POSITIVE_INFINITY;
      return (
        matchesSearch &&
        (status === "All" || order.status === status) &&
        (!storeId || order.storeId === storeId) &&
        createdAt >= start &&
        createdAt <= end
      );
    });
  }, [fromDate, initialOrders, query, status, storeId, toDate]);
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const orders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [fromDate, query, status, storeId, toDate]);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const rangeStart = filteredOrders.length ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = Math.min(page * pageSize, filteredOrders.length);

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
          <Card key={label} className={orderSurfaceClassName}>
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

      <Card className={orderSurfaceClassName}>
        <CardHeader className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="relative block min-w-0 flex-1 text-[11px] font-medium text-[#385071] sm:max-w-[420px]">
              Search
              <Search className="absolute left-3 top-[calc(50%+8px)] h-4 w-4 -translate-y-1/2 text-[#52627A]" />
              <Input
                aria-label="Search orders"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order, customer, or mobile"
                className="mt-1 h-9 pl-9"
              />
            </label>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[11px] font-medium text-[#385071]">
              From date
              <Input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="mt-1 h-9 text-[12px]"
              />
            </label>
            <label className="text-[11px] font-medium text-[#385071]">
              To date
              <Input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => setToDate(event.target.value)}
                className="mt-1 h-9 text-[12px]"
              />
            </label>
            {stores.length > 1 ? (
              <label className="text-[11px] font-medium text-[#385071]">
                Store
                <MuiSelect
                  aria-label="Store"
                  value={storeId}
                  onChange={(event) => setStoreId(event.target.value)}
                  className="mt-1 h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333]"
                >
                  <option value="">All stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </MuiSelect>
              </label>
            ) : null}
            <label className="text-[11px] font-medium text-[#385071]">
              Status
              <MuiSelect
                aria-label="Status"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as PortalOrderStatus | "All")
                }
                className="mt-1 h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333]"
              >
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
                  <option key={item} value={item}>
                    {item === "All" ? "All statuses" : item}
                  </option>
                ))}
              </MuiSelect>
            </label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <MuiTableContainer
            sx={{
              maxHeight: { xs: 420, md: 540 },
              overflow: "auto",
              borderTop: 1,
              borderColor: "divider",
            }}
          >
            <MuiDataTable
              stickyHeader
              size="small"
              aria-label="Orders table"
              sx={{ minWidth: 920 }}
            >
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  {stores.length > 1 ? <TableHead>Store</TableHead> : null}
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
                    <TableRow key={order.id} hover>
                      <TableCell>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-medium text-[#075DFF] hover:underline"
                        >
                          {order.id}
                        </Link>
                      </TableCell>
                      {stores.length > 1 ? (
                        <TableCell>{order.storeName ?? "—"}</TableCell>
                      ) : null}
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
                      colSpan={stores.length > 1 ? 8 : 7}
                      className="h-32 text-center text-[13px] text-[#52627A]"
                    >
                      No matching orders.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </MuiDataTable>
          </MuiTableContainer>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EDF5] px-4 py-3">
            <span className="text-[11px] text-[#52627A]">
              Showing {rangeStart}–{rangeEnd} of {filteredOrders.length}
            </span>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, nextPage) => setPage(nextPage)}
              size="small"
              color="primary"
              shape="rounded"
              aria-label="Order pages"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminOrderDetails({
  initialOrder,
}: {
  initialOrder: AdminOrder;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState<PortalOrderStatus | null>(null);
  const [editing, setEditing] = useState(false);
  const [editPickupAt, setEditPickupAt] = useState(
    localDateTimeValue(initialOrder.pickupAt),
  );
  const [editPaymentMethod, setEditPaymentMethod] = useState(
    initialOrder.paymentMethod,
  );
  const [editInstructions, setEditInstructions] = useState(
    initialOrder.instructions,
  );
  const [editSaving, setEditSaving] = useState(false);
  const [taskSaving, setTaskSaving] = useState<"pickup" | "delivery" | null>(
    null,
  );
  const [pickupSchedule, setPickupSchedule] = useState(
    initialOrder.pickupTask
      ? localDateTimeValue(initialOrder.pickupTask.scheduledAt)
      : localDateTimeValue(initialOrder.pickupAt),
  );
  const [deliverySchedule, setDeliverySchedule] = useState(
    initialOrder.deliveryTask
      ? localDateTimeValue(initialOrder.deliveryTask.scheduledAt)
      : "",
  );
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [printingTags, setPrintingTags] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionRows, setInspectionRows] = useState(() => {
    const first = initialOrder.inspectionCatalog?.[0];
    return first ? [{ key: 1, garmentId: first.garmentId, serviceId: first.serviceId, quantity: 1, rate: first.price, discountPerItem: 0, stain: "", damage: "", fabric: "", instructions: "" }] : [];
  });
  const nextStatuses = allowedOrderTransitions[order.status];

  useEffect(() => {
    const resetTagPrint = () => setPrintingTags(false);
    window.addEventListener("afterprint", resetTagPrint);
    return () => window.removeEventListener("afterprint", resetTagPrint);
  }, []);

  function printItemTags() {
    setPrintingTags(true);
    window.setTimeout(() => window.print(), 0);
  }

  function startEditing() {
    setEditPickupAt(localDateTimeValue(order.pickupAt));
    setEditPaymentMethod(order.paymentMethod);
    setEditInstructions(order.instructions);
    setEditing(true);
  }

  function addInspectionRow() {
    const first = order.inspectionCatalog?.[0];
    if (!first) return;
    setInspectionRows((rows) => [...rows, { key: Date.now(), garmentId: first.garmentId, serviceId: first.serviceId, quantity: 1, rate: first.price, discountPerItem: 0, stain: "", damage: "", fabric: "", instructions: "" }]);
  }

  async function saveInspection() {
    if (!inspectionRows.length) {
      toast.error("Add at least one item.");
      return;
    }
    setInspectionSaving(true);
    try {
      const response = await apiFetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inspection", items: inspectionRows.map(({ key: _key, ...item }) => item) }),
      });
      const data = (await response.json()) as { order?: AdminOrder; message?: string };
      if (!response.ok || !data.order) {
        toast.error(data.message ?? "Unable to save inspected items.");
        return;
      }
      setOrder(data.order);
      setInspectionOpen(false);
      toast.success("Final order sent to customer for confirmation.");
    } catch {
      toast.error("Unable to save inspected items. Check your connection.");
    } finally {
      setInspectionSaving(false);
    }
  }

  async function saveOrderDetails() {
    const pickupDate = new Date(editPickupAt);
    if (Number.isNaN(pickupDate.getTime())) {
      toast.error("Choose a valid pickup time.");
      return;
    }
    setEditSaving(true);
    try {
      const response = await apiFetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          pickupAt: pickupDate.toISOString(),
          paymentMethod: editPaymentMethod,
          instructions: editInstructions,
        }),
      });
      const data = (await response.json()) as {
        order?: AdminOrder;
        message?: string;
      };
      if (!response.ok || !data.order) {
        toast.error(data.message ?? "Unable to update order.");
        return;
      }
      setOrder(data.order);
      setPickupSchedule(
        data.order.pickupTask
          ? localDateTimeValue(data.order.pickupTask.scheduledAt)
          : localDateTimeValue(data.order.pickupAt),
      );
      setEditing(false);
      toast.success("Order details updated");
    } catch {
      toast.error(
        "Unable to update order. Check your connection and try again.",
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function rescheduleTask(type: "pickup" | "delivery") {
    const task = type === "pickup" ? order.pickupTask : order.deliveryTask;
    const value = type === "pickup" ? pickupSchedule : deliverySchedule;
    if (!task || !value) return;
    const scheduledDate = new Date(value);
    if (Number.isNaN(scheduledDate.getTime())) {
      toast.error(`Choose a valid ${type} time.`);
      return;
    }
    setTaskSaving(type);
    try {
      const response = await apiFetch(
        `/api/admin/${type === "pickup" ? "pickups" : "deliveries"}/${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: scheduledDate.toISOString() }),
        },
      );
      const data = (await response.json()) as {
        pickup?: { scheduledAt: string };
        delivery?: { scheduledAt: string };
        message?: string;
      };
      const updated = type === "pickup" ? data.pickup : data.delivery;
      if (!response.ok || !updated) {
        toast.error(data.message ?? `Unable to reschedule ${type}.`);
        return;
      }
      setOrder((current) =>
        type === "pickup" && current.pickupTask
          ? {
              ...current,
              pickupAt: updated.scheduledAt,
              pickupTask: {
                ...current.pickupTask,
                scheduledAt: updated.scheduledAt,
              },
            }
          : type === "delivery" && current.deliveryTask
            ? {
                ...current,
                deliveryTask: {
                  ...current.deliveryTask,
                  scheduledAt: updated.scheduledAt,
                },
              }
            : current,
      );
      toast.success(`${type === "pickup" ? "Pickup" : "Delivery"} rescheduled`);
    } catch {
      toast.error(
        `Unable to reschedule ${type}. Check your connection and try again.`,
      );
    } finally {
      setTaskSaving(null);
    }
  }

  async function updatePaymentStatus(
    nextStatus: "Paid" | "Failed" | "Refunded",
  ) {
    if (!order.payment) return;
    if (
      nextStatus === "Refunded" &&
      !window.confirm(
        `Refund ₹${order.payment.amount.toLocaleString("en-IN")} to the customer's wallet?`,
      )
    ) {
      return;
    }
    setPaymentSaving(true);
    try {
      const response = await apiFetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payment", status: nextStatus }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "Unable to update payment.");
        return;
      }
      setOrder((current) => ({
        ...current,
        paymentStatus: nextStatus,
        payment: current.payment
          ? { ...current.payment, status: nextStatus }
          : null,
      }));
      toast.success(`Payment marked ${nextStatus}`);
    } catch {
      toast.error(
        "Unable to update payment. Check your connection and try again.",
      );
    } finally {
      setPaymentSaving(false);
    }
  }

  async function updateStatus(status: PortalOrderStatus) {
    let statusNote = note.trim();
    if (status === "Cancelled") {
      const reason = window.prompt(
        "Reason for cancelling this order",
        statusNote,
      );
      if (reason === null) return;
      statusNote = reason.trim();
      if (!statusNote) {
        toast.error("Enter a cancellation reason.");
        return;
      }
    } else if (
      status === "Delivered" &&
      !window.confirm("Mark this order delivered?")
    ) {
      return;
    }
    setSaving(status);
    try {
      const response = await apiFetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: statusNote }),
      });
      const data = (await response.json()) as {
        order?: AdminOrder;
        message?: string;
      };
      if (!response.ok || !data.order) {
        toast.error(data.message ?? "Unable to update order");
        return;
      }
      setOrder(data.order);
      setNote("");
      toast.success(`Order marked ${status}`);
    } catch {
      toast.error(
        "Unable to update order. Check your connection and try again.",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <div
      className={cn(
        "order-print-area space-y-3",
        printingTags && "print-item-tags",
      )}
    >
      <div className="item-tags-print-only" aria-label="Printable item tags">
        {order.items.map((item, index) => (
          <div key={`${item.name}-${index}`}>
            <div className="item-tag">
              <div className="flex items-center justify-between gap-2 pb-1">
                <span className="text-[12px] font-bold tracking-wide text-[#071333]">
                  MYDHOBI
                </span>
                <span className="text-[10px] text-[#52627A]">ITEM TAG</span>
              </div>
              <p className="mt-3 text-[16px] font-semibold text-[#071333]">
                {item.name}
              </p>
              <p className="mt-1 text-[12px] text-[#385071]">
                {item.serviceName ?? order.service}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-[#52627A]">
                <span>Order: {order.id}</span>
                <span>Qty: {item.quantity}</span>
                <span className="col-span-2 break-words">
                  Customer: {order.customerName}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-1 text-[12px] font-semibold text-[#071333]">
                <span>
                  Rate: ₹{item.unitPrice}
                  {(item.discountAmount ?? 0) > 0
                    ? ` (discount ₹${item.discountAmount ?? 0})`
                    : ""}
                </span>
                <span>Amount: ₹{item.quantity * item.unitPrice}</span>
              </div>
            </div>
            {index < order.items.length - 1 ? (
              <div className="item-tag-separator" aria-hidden="true" />
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
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
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          {order.invoicePending && order.inspectionCatalog?.length ? (
            <Button type="button" onClick={() => setInspectionOpen((open) => !open)}>
              {inspectionOpen ? "Close inspection" : "Inspect items"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="default"
            onClick={startEditing}
            disabled={
              order.status === "Delivered" || order.status === "Cancelled"
            }
          >
            Edit order
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={() => window.print()}
          >
            <Printer /> Print
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={!order.items.length}
            onClick={printItemTags}
            className="!bg-[#FACC15] !text-[#111827] hover:!bg-[#EAB308]"
          >
            <Tag /> Print item tags
          </Button>
        </div>
      </div>

      {editing ? (
        <Card className={`${orderSurfaceClassName} print:hidden`}>
          <CardHeader className="p-4 font-semibold">Edit order</CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-[11px] font-medium text-[#385071]">
                Pickup time
                <Input
                  type="datetime-local"
                  value={editPickupAt}
                  onChange={(event) => setEditPickupAt(event.target.value)}
                  className="mt-1 h-9 text-[12px]"
                />
              </label>
              <label className="text-[11px] font-medium text-[#385071]">
                Payment method
                <select
                  value={editPaymentMethod}
                  onChange={(event) => setEditPaymentMethod(event.target.value)}
                  className="mt-1 h-9 w-full rounded border border-[#DCE6F2] bg-white px-3 text-[12px] text-[#071333]"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </label>
              <label className="text-[11px] font-medium text-[#385071]">
                Instructions
                <Input
                  value={editInstructions}
                  maxLength={120}
                  onChange={(event) => setEditInstructions(event.target.value)}
                  placeholder="Optional"
                  className="mt-1 h-9 text-[12px]"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void saveOrderDetails()}
                disabled={editSaving}
              >
                {editSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {inspectionOpen ? (
        <Card className={`${orderSurfaceClassName} print:hidden`}>
          <CardHeader className="p-4 font-semibold">Inspect items</CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {inspectionRows.map((row, index) => {
              const selectedKey = `${row.garmentId}:${row.serviceId}`;
              return (
                <div key={row.key} className="rounded-lg border border-[#DCE6F2] p-3">
                  <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_100px_130px_36px]">
                    <label className="text-[11px] font-medium text-[#385071]">
                      Garment and service
                      <select value={selectedKey} onChange={(event) => {
                        const picked = order.inspectionCatalog?.find((option) => `${option.garmentId}:${option.serviceId}` === event.target.value);
                        if (!picked) return;
                        setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, garmentId: picked.garmentId, serviceId: picked.serviceId, rate: picked.price } : item));
                      }} className="mt-1 h-9 w-full rounded border border-[#DCE6F2] bg-white px-2 text-[12px]">
                        {order.inspectionCatalog?.map((option) => <option key={`${option.garmentId}:${option.serviceId}`} value={`${option.garmentId}:${option.serviceId}`}>{option.garmentName} · {option.serviceName} · ₹{option.price}</option>)}
                      </select>
                    </label>
                    <label className="text-[11px] font-medium text-[#385071]">Quantity<Input type="number" min={1} max={1000} value={row.quantity} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, quantity: Number(event.target.value) } : item))} className="mt-1 h-9 text-[12px]" /></label>
                    <label className="text-[11px] font-medium text-[#385071]">Rate per item<Input type="number" min={0} max={100000} value={row.rate} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, rate: Number(event.target.value) } : item))} className="mt-1 h-9 text-[12px]" /></label>
                    <Button type="button" variant="outline" aria-label={`Remove item ${index + 1}`} onClick={() => setInspectionRows((rows) => rows.filter((item) => item.key !== row.key))} className="mt-5 h-9 w-9 p-0"><Trash2 size={15} /></Button>
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <label className="text-[11px] font-medium text-[#385071]">Discount per item<Input type="number" min={0} max={row.rate} value={row.discountPerItem} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, discountPerItem: Number(event.target.value) } : item))} className="mt-1 h-9 text-[12px]" /></label>
                    <label className="text-[11px] font-medium text-[#385071]">Fabric<Input value={row.fabric} maxLength={40} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, fabric: event.target.value } : item))} placeholder="Optional" className="mt-1 h-9 text-[12px]" /></label>
                    <label className="text-[11px] font-medium text-[#385071]">Stain notes<Input value={row.stain} maxLength={160} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, stain: event.target.value } : item))} placeholder="Optional" className="mt-1 h-9 text-[12px]" /></label>
                    <label className="text-[11px] font-medium text-[#385071]">Damage notes<Input value={row.damage} maxLength={160} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, damage: event.target.value } : item))} placeholder="Optional" className="mt-1 h-9 text-[12px]" /></label>
                    <label className="text-[11px] font-medium text-[#385071] md:col-span-2">Special care<Input value={row.instructions} maxLength={160} onChange={(event) => setInspectionRows((rows) => rows.map((item, rowIndex) => rowIndex === index ? { ...item, instructions: event.target.value } : item))} placeholder="Optional" className="mt-1 h-9 text-[12px]" /></label>
                  </div>
                </div>
              );
            })}
            <div className="flex flex-wrap justify-between gap-2">
              <Button type="button" variant="outline" onClick={addInspectionRow}><Plus size={16} />Add item</Button>
              <Button type="button" onClick={() => void saveInspection()} disabled={inspectionSaving || !inspectionRows.length}>{inspectionSaving ? "Saving..." : "Send final order"}</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <Card className={orderSurfaceClassName}>
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
                    <TableRow
                      key={`${item.name}-${item.alias ?? ""}-${item.quantity}`}
                    >
                      <TableCell>
                        <p className="font-medium">{item.name}</p>
                        {[
                          item.alias,
                          item.packingType,
                          item.brand,
                          item.fabric,
                          item.defect && item.defect !== "None"
                            ? item.defect
                            : "",
                        ].filter(Boolean).length ? (
                          <p className="mt-1 text-[11px] font-normal text-[#52627A]">
                            {[
                              item.alias,
                              item.packingType,
                              item.brand,
                              item.fabric,
                              item.defect && item.defect !== "None"
                                ? item.defect
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.discountAmount ?? 0) > 0 ? (
                          <span className="block text-[10px] text-[#71809A] line-through">
                            ₹{item.baseUnitPrice ?? item.unitPrice}
                          </span>
                        ) : null}
                        <span>₹{item.unitPrice}</span>
                        {(item.discountAmount ?? 0) > 0 ? (
                          <span className="mt-0.5 block text-[10px] text-[#16803C]">
                            −₹{item.discountAmount ?? 0} / unit
                            {item.discountType && item.discountType !== "None"
                              ? ` · ${item.discountType === "Percentage" ? `${item.discountValue ?? 0}%` : `₹${item.discountValue ?? 0}`}`
                              : ""}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₹{item.quantity * item.unitPrice}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-semibold">
                      Subtotal
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{order.subtotal.toLocaleString("en-IN")}
                    </TableCell>
                  </TableRow>
                  {order.discountAmount > 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-[#0C9E78]">
                        Discount
                        {order.couponCode ? ` (${order.couponCode})` : ""}
                      </TableCell>
                      <TableCell className="text-right text-[#0C9E78]">
                        -₹{order.discountAmount.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ) : null}
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

          <Card className={orderSurfaceClassName}>
            <CardHeader className="p-4 font-semibold">
              Order Timeline
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
              {order.timeline.map((event, index) => (
                <div
                  key={`${event.status}-${event.createdAt}`}
                  className="flex gap-3"
                >
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
          <Card className={orderSurfaceClassName}>
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

          <Card className={orderSurfaceClassName}>
            <CardHeader className="p-4 font-semibold">
              Fulfilment and payment
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0 text-[12px]">
              <div className="grid grid-cols-[120px_1fr] gap-y-2">
                <span className="text-[#52627A]">Pickup</span>
                <span>
                  {order.pickupTask
                    ? formatDate(order.pickupTask.scheduledAt)
                    : formatDate(order.pickupAt)}
                </span>
                <span className="text-[#52627A]">Pickup rider</span>
                <span>{order.pickupTask?.riderName ?? "Not assigned"}</span>
                <span className="text-[#52627A]">Delivery</span>
                <span>
                  {order.deliveryTask
                    ? formatDate(order.deliveryTask.scheduledAt)
                    : "Created when ready"}
                </span>
                <span className="text-[#52627A]">Delivery rider</span>
                <span>{order.deliveryTask?.riderName ?? "Not assigned"}</span>
                <span className="text-[#52627A]">Service</span>
                <span>{order.service}</span>
                <span className="text-[#52627A]">Payment</span>
                <span>{order.payment?.status ?? order.paymentStatus}</span>
                <span className="text-[#52627A]">Method</span>
                <span className="capitalize">
                  {order.payment?.method ?? order.paymentMethod}
                </span>
                {order.payment?.reference ? (
                  <>
                    <span className="text-[#52627A]">Reference</span>
                    <span className="break-all">{order.payment.reference}</span>
                  </>
                ) : null}
              </div>
              {order.pickupTask ? (
                <div className="space-y-2 border-t border-[#E8EEF6] pt-3 print:hidden">
                  <label className="block text-[11px] font-medium text-[#385071]">
                    Reschedule pickup
                    <Input
                      type="datetime-local"
                      value={pickupSchedule}
                      onChange={(event) =>
                        setPickupSchedule(event.target.value)
                      }
                      disabled={
                        taskSaving !== null ||
                        order.pickupTask.status === "Completed"
                      }
                      className="mt-1 h-9 text-[12px]"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      taskSaving !== null ||
                      order.pickupTask.status === "Completed"
                    }
                    onClick={() => void rescheduleTask("pickup")}
                  >
                    {taskSaving === "pickup" ? "Saving..." : "Save pickup time"}
                  </Button>
                </div>
              ) : null}
              {order.deliveryTask ? (
                <div className="space-y-2 border-t border-[#E8EEF6] pt-3 print:hidden">
                  <label className="block text-[11px] font-medium text-[#385071]">
                    Reschedule delivery
                    <Input
                      type="datetime-local"
                      value={deliverySchedule}
                      onChange={(event) =>
                        setDeliverySchedule(event.target.value)
                      }
                      disabled={
                        taskSaving !== null ||
                        order.deliveryTask.status === "Delivered"
                      }
                      className="mt-1 h-9 text-[12px]"
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      taskSaving !== null ||
                      order.deliveryTask.status === "Delivered"
                    }
                    onClick={() => void rescheduleTask("delivery")}
                  >
                    {taskSaving === "delivery"
                      ? "Saving..."
                      : "Save delivery time"}
                  </Button>
                </div>
              ) : null}
              {order.payment ? (
                <div className="flex flex-wrap gap-2 border-t border-[#E8EEF6] pt-3 print:hidden">
                  {order.payment.status === "Pending" ? (
                    <>
                      <Button
                        type="button"
                        disabled={paymentSaving}
                        onClick={() => void updatePaymentStatus("Paid")}
                      >
                        {paymentSaving ? "Saving..." : "Mark paid"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={paymentSaving}
                        onClick={() => void updatePaymentStatus("Failed")}
                      >
                        Mark failed
                      </Button>
                    </>
                  ) : null}
                  {order.payment.status === "Paid" &&
                  ["Delivered", "Cancelled"].includes(order.status) ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={paymentSaving}
                      onClick={() => void updatePaymentStatus("Refunded")}
                      className="border-red-200 text-red-700"
                    >
                      Refund payment
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className={orderSurfaceClassName}>
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

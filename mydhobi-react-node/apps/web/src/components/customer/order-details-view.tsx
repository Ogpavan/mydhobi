import { MuiAction } from "@/components/ui/native-controls";
import Link, { useRouter } from "@/platform/navigation";
import { apiFetch } from "@/platform/http";
import { toast } from "@/platform/notifications";
import { Check, Package } from "lucide-react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerBackButton } from "@/components/customer/customer-simple-header";
import { startNavigationProgress } from "@/components/navigation-loader";
import { readDraft, saveDraft } from "./ordering-state";
import { invalidateCustomerData } from "./customer-client-data";
import type { PortalOrder, PortalOrderStatus } from "@/lib/customer-portal";
import { cn } from "@/lib/utils";
import { useState } from "react";

const timeline: Array<{ status: PortalOrderStatus; label: string }> = [
  { status: "New", label: "Order Placed" },
  { status: "Pickup Scheduled", label: "Pickup Scheduled" },
  { status: "Rider Assigned", label: "Rider Assigned" },
  { status: "Out for Pickup", label: "Out for Pickup" },
  { status: "Picked Up", label: "Picked Up" },
  { status: "Received at Store", label: "Received at Store" },
  { status: "Inspection in Progress", label: "Items Inspected" },
  { status: "Awaiting Confirmation", label: "Awaiting Confirmation" },
  { status: "Confirmed", label: "Order Confirmed" },
  { status: "In Cleaning", label: "In Cleaning" },
  { status: "Quality Check", label: "Quality Check" },
  { status: "Ready", label: "Ready" },
  { status: "Delivery Assigned", label: "Delivery Assigned" },
  { status: "Out for Delivery", label: "Out for Delivery" },
  { status: "Delivered", label: "Delivered" },
];

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

function customerStatus(status: PortalOrderStatus) {
  return status === "New" ? "Order Placed" : status;
}

export function OrderDetailsView({
  order: initialOrder,
}: {
  order: PortalOrder;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [confirming, setConfirming] = useState(false);
  const currentIndex = timeline.findIndex(
    (step) => step.status === order.status,
  );
  const eventByStatus = new Map(
    order.timeline.map((event) => [event.status, event]),
  );
  function reorder() {
    const serviceIds =
      order.requestedServices?.map((service) => service.id) ?? [];
    saveDraft({
      ...readDraft(),
      kind: "quick",
      storeId: order.storeId ?? "",
      addressId: order.addressId ?? "",
      serviceIds,
      quickItemCount: 0,
      date: "",
      slot: "",
      coupon: "",
      requestKey: "",
      items: [],
    });
    startNavigationProgress();
    router.push("/customer/schedule");
  }

  async function confirmOrder(paymentMethod: "cash" | "wallet") {
    setConfirming(true);
    try {
      const response = await apiFetch(
        `/api/customer/orders/${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "confirm", paymentMethod }),
        },
      );
      const data = (await response.json()) as {
        order?: PortalOrder;
        message?: string;
      };
      if (!response.ok || !data.order) {
        toast.error(data.message ?? "Unable to confirm this order.");
        return;
      }
      setOrder(data.order);
      invalidateCustomerData("/api/customer/orders");
      toast.success(
        paymentMethod === "wallet"
          ? "Order confirmed and paid."
          : "Order confirmed.",
      );
    } catch {
      toast.error("Unable to confirm this order. Check your connection.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[156px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <CustomerBackButton
            fallback="/customer/orders"
            ariaLabel="Back to orders"
          />
          <h1 className="text-[15px] font-bold">Order Details</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        {order.invoicePending && (
          <p role="status" className="mb-4 rounded-lg bg-[#eee8ff] p-3 text-sm">
            Final item count and price will be ready after store inspection.
          </p>
        )}
        <section className="flex items-center justify-between rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3">
          <div>
            <h2 className="text-[12px] font-bold">Order #{order.id}</h2>
            <p className="mt-1 text-[9px] text-[#77798a]">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <span className="rounded-md bg-[#eee8ff] px-2 py-1 text-[9px] font-bold text-[#7040d7]">
            {customerStatus(order.status)}
          </span>
        </section>

        <section className="mt-4">
          <h2 className="text-[11px] font-bold">Order Timeline</h2>
          <ol className="mt-3">
            {timeline.map(({ status, label }, index) => {
              const event =
                eventByStatus.get(status) ??
                (status === "Pickup Scheduled"
                  ? eventByStatus.get("New")
                  : undefined);
              const complete =
                order.status !== "Cancelled" && index <= currentIndex;
              return (
                <li key={label} className="relative flex min-h-[53px] gap-3">
                  {index < timeline.length - 1 && (
                    <span
                      className={cn(
                        "absolute left-[7px] top-4 h-full w-px",
                        complete ? "bg-[#32bd61]" : "bg-[#d5d3dd]",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-white",
                      complete
                        ? "border-[#2abb5a] bg-[#2abb5a] text-white"
                        : "border-[#aaaab5] text-[#9293a0]",
                    )}
                  >
                    {complete ? (
                      <Check className="h-2.5 w-2.5" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-current" />
                    )}
                  </span>
                  <div>
                    <p className="text-[10px] font-bold">{label}</p>
                    <p className="mt-1 text-[9px] text-[#77798a]">
                      {event ? formatDate(event.createdAt) : "To be updated"}
                    </p>
                  </div>
                </li>
              );
            })}
            {order.status === "Cancelled" ? (
              <li className="flex min-h-[40px] gap-3">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#D54A4A] text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold text-[#D54A4A]">
                    Cancelled
                  </p>
                  <p className="mt-1 text-[9px] text-[#77798a]">
                    {eventByStatus.get("Cancelled")
                      ? formatDate(eventByStatus.get("Cancelled")!.createdAt)
                      : ""}
                  </p>
                </div>
              </li>
            ) : null}
          </ol>
        </section>

        <section className="rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3">
          <h2 className="text-[11px] font-bold">Order Items</h2>
          <div className="mt-3 space-y-3">
            {order.items.length ? (
              order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 text-[10px]"
                >
                  <span>
                    <span className="block">{item.name}</span>
                    {[
                      item.alias,
                      item.packingType,
                      item.brand,
                      item.fabric,
                      item.defect && item.defect !== "None" ? item.defect : "",
                    ].filter(Boolean).length ? (
                      <span className="mt-1 block text-[9px] text-[#8a8898]">
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
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[#77798a]">
                    {item.quantity} × ₹{item.unitPrice}
                  </span>
                  <span className="w-10 text-right font-semibold">
                    ₹{item.quantity * item.unitPrice}
                  </span>
                </div>
              ))
            ) : order.invoicePending ? (
              <p className="text-[10px] text-[#77798a]">
                Items will be added after the store inspects your bag.
              </p>
            ) : null}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eceaf1] pt-3 text-[10px] font-bold">
            <span>Total Items</span>
            <span>{order.itemCount} items</span>
          </div>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 border-t border-[#eceaf1] pt-3 text-[10px]">
            <dt className="text-[#77798a]">Subtotal</dt>
            <dd>
              {order.invoicePending ? "After inspection" : `₹${order.subtotal}`}
            </dd>
            {order.discountAmount > 0 ? (
              <>
                <dt className="text-[#23a84f]">
                  Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                </dt>
                <dd className="text-[#23a84f]">-₹{order.discountAmount}</dd>
              </>
            ) : null}
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">
              {order.invoicePending ? "After inspection" : `₹${order.amount}`}
            </dd>
          </dl>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[70px] z-30 border-t border-[#eceaf2] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#7440dc]">Total Amount</p>
            <p className="text-[20px] font-bold text-[#7440dc]">
              {order.invoicePending ? "Pending invoice" : `₹${order.amount}`}
            </p>
          </div>
          {order.status === "Awaiting Confirmation" ? (
            <div className="flex flex-wrap justify-end gap-2">
              <MuiAction
                type="button"
                disabled={confirming}
                onClick={() => void confirmOrder("cash")}
                className="flex h-11 items-center justify-center rounded-[12px] border border-[#7440dc] px-4 text-[11px] font-bold text-[#7440dc]"
              >
                {confirming ? "Saving..." : "Confirm · Pay Later"}
              </MuiAction>
              <MuiAction
                type="button"
                disabled={confirming}
                onClick={() => void confirmOrder("wallet")}
                className="flex h-11 items-center justify-center rounded-[12px] bg-[#7440dc] px-4 text-[11px] font-bold text-white"
              >
                Pay with Wallet
              </MuiAction>
            </div>
          ) : (
            <MuiAction
              type="button"
              onClick={reorder}
              className="flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(100deg,#7138e2,#8d4df0)] px-5 text-[12px] font-bold text-white"
            >
              <Package className="h-4 w-4" />
              Reorder
            </MuiAction>
          )}
        </div>
      </div>

      <CustomerBottomNav active="orders" />
    </div>
  );
}

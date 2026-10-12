import { MuiAction } from "@/components/ui/native-controls";
import Link from "@/platform/navigation";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  PackageCheck,
} from "lucide-react";
import { useState } from "react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerBackButton } from "@/components/customer/customer-simple-header";
import type { CustomerOrder, CustomerOrderStatus } from "@/lib/customer-orders";
import { cn } from "@/lib/utils";

const tabs = ["Active", "Completed", "Cancelled"] as const;
type OrdersTab = (typeof tabs)[number];

const statusClass: Partial<Record<CustomerOrderStatus, string>> = {
  "In Progress": "bg-[#eee8ff] text-[#6033c7]",
  "Pickup Scheduled": "bg-[#eee8ff] text-[#6033c7]",
  "Rider Assigned": "bg-[#e8f2ff] text-[#285f9c]",
  "Out for Pickup": "bg-[#e8f2ff] text-[#285f9c]",
  "Picked Up": "bg-[#e8f2ff] text-[#285f9c]",
  "Received at Store": "bg-[#e8f2ff] text-[#285f9c]",
  "Inspection in Progress": "bg-[#fff5d9] text-[#896510]",
  "Awaiting Confirmation": "bg-[#fff5d9] text-[#896510]",
  Confirmed: "bg-[#eee8ff] text-[#6033c7]",
  "In Cleaning": "bg-[#eee8ff] text-[#6033c7]",
  "Quality Check": "bg-[#eee8ff] text-[#6033c7]",
  Ready: "bg-[#e4f7e9] text-[#207b3d]",
  "Delivery Assigned": "bg-[#fff0df] text-[#a54e0d]",
  "Out for Delivery": "bg-[#fff0df] text-[#a54e0d]",
  Delivered: "bg-[#e4f7e9] text-[#207b3d]",
  Cancelled: "bg-[#fee9e9] text-[#bd3535]",
};

function matchesTab(order: CustomerOrder, tab: OrdersTab) {
  if (tab === "Active")
    return order.status !== "Delivered" && order.status !== "Cancelled";
  if (tab === "Completed") return order.status === "Delivered";
  return order.status === "Cancelled";
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function EmptyOrders({ tab }: { tab: OrdersTab }) {
  const emptyText: Record<OrdersTab, string> = {
    Active: "No active orders",
    Completed: "No completed orders yet",
    Cancelled: "No cancelled orders",
  };

  return (
    <section className="flex flex-col items-center px-5 py-14 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-[#f0eaff] text-[#7040dc]">
        {tab === "Completed" ? (
          <PackageCheck aria-hidden="true" size={25} />
        ) : (
          <ClipboardList aria-hidden="true" size={25} />
        )}
      </span>
      <h2 className="mt-4 text-[15px] font-bold text-[#292438]">
        {emptyText[tab]}
      </h2>
      {tab === "Active" && (
        <Link
          href="/customer"
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#7040dc] px-4 text-[13px] font-bold text-white hover:bg-[#6033c7]"
        >
          Book a pickup
          <ArrowRight aria-hidden="true" size={16} />
        </Link>
      )}
    </section>
  );
}

export function MyOrdersView({ orders }: { orders: CustomerOrder[] }) {
  const [tab, setTab] = useState<OrdersTab>("Active");
  const visibleOrders = orders.filter((order) => matchesTab(order, tab));
  const tabCount = (name: OrdersTab) =>
    orders.filter((order) => matchesTab(order, name)).length;

  return (
    <div className="min-h-screen bg-[#faf9fd] pb-[88px] text-[#211d2c]">
      <header className="sticky top-0 z-40 border-b border-[#ebe7f1] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <CustomerBackButton fallback="/customer" ariaLabel="Back to home" />
          <h1 className="text-[15px] font-bold">My Orders</h1>
        </div>
        <div
          role="tablist"
          aria-label="Order status"
          className="mx-auto grid max-w-[720px] grid-cols-3 px-3"
        >
          {tabs.map((item) => {
            const selected = tab === item;
            return (
              <MuiAction
                key={item}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item)}
                className={cn(
                  "relative min-h-11 gap-1 px-1 text-[12px] font-semibold normal-case after:absolute after:bottom-0 after:left-1 after:right-1 after:h-0.5 after:rounded-full after:content-['']",
                  selected
                    ? "text-[#6033c7] after:bg-[#7040dc]"
                    : "text-[#777181] after:bg-transparent",
                )}
              >
                {item}
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 py-0.5 text-[10px]",
                    selected
                      ? "bg-[#eee8ff] text-[#6033c7]"
                      : "bg-[#f2f0f5] text-[#716b7b]",
                  )}
                >
                  {tabCount(item)}
                </span>
              </MuiAction>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        {visibleOrders.length === 0 ? (
          <EmptyOrders tab={tab} />
        ) : (
          <section
            aria-label={`${tab} orders`}
            className="space-y-2.5"
            role="tabpanel"
          >
            {visibleOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-[#e7e3ed] bg-white px-3.5 py-3 shadow-[0_2px_8px_rgba(40,29,66,0.035)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-all text-[13px] font-bold text-[#292438]">
                      #{order.id}
                    </h2>
                    <p className="mt-0.5 text-[10px] text-[#777181]">
                      {order.shortDate}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      statusClass[order.status] ??
                        "bg-[#eee8ff] text-[#6033c7]",
                    )}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-[12px] font-semibold text-[#393447]">
                    {order.service}
                    <span className="font-normal text-[#777181]">
                      {" "}
                      ·{" "}
                      {order.itemCount > 0
                        ? `${order.itemCount} items`
                        : "Items after check"}
                    </span>
                  </p>
                  <p className="text-[12px] font-semibold text-[#393447]">
                    {order.invoicePending
                      ? "Price after item check"
                      : money(order.amount)}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#efedf3] pt-2.5">
                  <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-[#514b5d]">
                    <CalendarDays
                      aria-hidden="true"
                      className="shrink-0 text-[#817995]"
                      size={14}
                    />
                    <span className="truncate">{order.pickup}</span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-semibold",
                      order.paid
                        ? "text-[#207b3d]"
                        : order.invoicePending
                          ? "text-[#777181]"
                          : "text-[#a65a0c]",
                    )}
                  >
                    {order.paid
                      ? "Paid"
                      : order.invoicePending
                        ? "After check"
                        : "Due"}
                  </span>
                </div>
                <div className="mt-1 flex justify-end">
                  <Link
                    href={`/customer/orders/${encodeURIComponent(order.id)}`}
                    className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-[11px] font-bold text-[#6033c7] hover:bg-[#f4f0fc]"
                  >
                    Track order
                    <ArrowRight aria-hidden="true" size={15} />
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>

      <CustomerBottomNav active="orders" />
    </div>
  );
}

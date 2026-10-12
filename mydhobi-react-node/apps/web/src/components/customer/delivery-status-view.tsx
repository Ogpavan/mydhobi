import Link from "@/platform/navigation";
import { ChevronRight, MapPin, Truck } from "lucide-react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { CustomerBackButton } from "@/components/customer/customer-simple-header";
import type { PortalOrder, PortalOrderStatus } from "@/lib/customer-portal";

function isDeliveryStatus(status: PortalOrderStatus) {
  return (
    status === "Ready" ||
    status === "Out for Delivery" ||
    status === "Delivered"
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function statusText(status: PortalOrderStatus) {
  if (status === "Ready") return "Ready for delivery";
  if (status === "Out for Delivery") return "Out for delivery";
  return "Delivered";
}

function statusTone(status: PortalOrderStatus) {
  if (status === "Delivered") return "bg-[#e9f6ed] text-[#4c8061]";
  if (status === "Out for Delivery") return "bg-[#fff3e4] text-[#a06d35]";
  return "bg-[#eee8ff] text-[#7040d7]";
}

function deliveryTiming(order: PortalOrder) {
  if (order.status === "Delivered" && order.deliveryAt) {
    return `Delivered ${formatDate(order.deliveryAt)}`;
  }
  if (order.status === "Out for Delivery") return "Your order is on the way";
  return "Delivery date will be updated soon";
}

export function DeliveryStatusView({ orders }: { orders: PortalOrder[] }) {
  const deliveries = orders.filter((order) => isDeliveryStatus(order.status));

  return (
    <div className="min-h-screen bg-[#fafafe] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <CustomerBackButton fallback="/customer" ariaLabel="Back to home" />
          <h1 className="text-[15px] font-bold">Delivery</h1>
          <Link
            href="/customer/orders"
            className="absolute right-3 rounded-md px-2 py-1 text-[10px] font-bold text-[#7440dc] hover:bg-[#f4efff]"
          >
            My Orders
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] space-y-3 px-4 py-4">
        {deliveries.length === 0 ? (
          <section className="rounded-[12px] border border-dashed border-[#dcd8e7] bg-white px-4 py-14 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eee8ff] text-[#7440dc]">
              <Truck className="h-7 w-7" aria-hidden="true" />
            </span>
            <p className="mt-4 text-[13px] font-bold">No deliveries yet</p>
            <p className="mt-2 text-[11px] text-[#77798a]">
              Your delivery will appear here when an order is ready.
            </p>
            <Link
              href="/customer/orders"
              className="mt-5 inline-flex h-10 items-center rounded-[10px] bg-[#7440dc] px-4 text-[11px] font-bold text-white"
            >
              View orders
            </Link>
          </section>
        ) : (
          deliveries.map((order) => (
            <article
              key={order.id}
              className="rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3 shadow-[0_3px_10px_rgba(55,48,78,0.04)]"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f0eaff] text-[#7440dc]">
                  <Truck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-bold">
                        {order.service}
                      </p>
                      <p className="mt-1 text-[10px] text-[#77798a]">
                        #{order.id} · {order.itemCount} items
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-bold ${statusTone(order.status)}`}
                    >
                      {statusText(order.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 space-y-2 rounded-lg bg-[#f8f6fc] px-3 py-2.5 text-[10px] text-[#5e5b6c]">
                <p className="font-semibold">{deliveryTiming(order)}</p>
                <p className="flex min-w-0 items-start gap-2">
                  <MapPin
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7440dc]"
                    aria-hidden="true"
                  />
                  <span className="truncate">{order.address}</span>
                </p>
              </div>

              <Link
                href={`/customer/orders/${encodeURIComponent(order.id)}`}
                className="mt-3 flex items-center justify-between border-t border-[#eeecf2] pt-3 text-[10px] font-bold text-[#7440dc]"
              >
                Track order
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))
        )}
      </main>

      <CustomerBottomNav active="orders" />
    </div>
  );
}

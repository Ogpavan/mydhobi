"use client";

import { ArrowLeft, Check, Package } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { startNavigationProgress } from "@/components/navigation-loader";
import { writeCustomerCart } from "@/lib/customer-cart";
import type {
  PortalOrder,
  PortalOrderStatus,
} from "@/lib/customer-portal";
import { cn } from "@/lib/utils";

const timeline: Array<{ status: PortalOrderStatus; label: string }> = [
  { status: "New", label: "Order Placed" },
  { status: "Picked Up", label: "Picked Up" },
  { status: "In Cleaning", label: "In Cleaning" },
  { status: "Ready", label: "Ready" },
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
  if (status === "Out for Delivery" || status === "Delivered" || status === "Cancelled") {
    return status;
  }
  return "In Progress";
}

export function OrderDetailsView({ order }: { order: PortalOrder }) {
  const router=useRouter();
  const currentIndex = timeline.findIndex((step) => step.status === order.status);
  const eventByStatus = new Map(
    order.timeline.map((event) => [event.status, event]),
  );
  function reorder(){
    writeCustomerCart({
      service:order.service,
      serviceSlug:order.service.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
      items:order.items.map(item=>({...item,image:"/wash_fold.png"})),
    });
    startNavigationProgress();router.push("/customer/cart");
  }

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[148px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link href="/customer/orders" aria-label="Back to orders" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">Order Details</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        <section className="flex items-center justify-between rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3">
          <div>
            <h2 className="text-[12px] font-bold">Order #{order.id}</h2>
            <p className="mt-1 text-[9px] text-[#77798a]">{formatDate(order.createdAt)}</p>
          </div>
          <span className="rounded-md bg-[#eee8ff] px-2 py-1 text-[9px] font-bold text-[#7040d7]">{customerStatus(order.status)}</span>
        </section>

        <section className="mt-4">
          <h2 className="text-[11px] font-bold">Order Timeline</h2>
          <ol className="mt-3">
            {timeline.map(({ status, label }, index) => {
              const event = eventByStatus.get(status);
              const complete =
                order.status !== "Cancelled" && index <= currentIndex;
              return (
                <li key={label} className="relative flex min-h-[53px] gap-3">
                  {index < timeline.length - 1 && <span className={cn("absolute left-[7px] top-4 h-full w-px", complete ? "bg-[#32bd61]" : "bg-[#d5d3dd]")} />}
                  <span className={cn("relative z-10 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border bg-white", complete ? "border-[#2abb5a] bg-[#2abb5a] text-white" : "border-[#aaaab5] text-[#9293a0]")}>
                    {complete ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-current" />}
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
                  <p className="text-[10px] font-bold text-[#D54A4A]">Cancelled</p>
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
            {order.items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_auto_auto] gap-4 text-[10px]">
                <span><span className="block">{item.name}</span>{[item.alias, item.packingType, item.brand, item.fabric, item.defect && item.defect !== "None" ? item.defect : ""].filter(Boolean).length ? <span className="mt-1 block text-[9px] text-[#8a8898]">{[item.alias, item.packingType, item.brand, item.fabric, item.defect && item.defect !== "None" ? item.defect : ""].filter(Boolean).join(" · ")}</span> : null}</span>
                <span className="text-[#77798a]">
                  {item.quantity} × ₹{item.unitPrice}
                </span>
                <span className="w-10 text-right font-semibold">
                  ₹{item.quantity * item.unitPrice}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eceaf1] pt-3 text-[10px] font-bold">
            <span>Total Items</span>
            <span>{order.itemCount} items</span>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[70px] z-40 border-t border-[#eceaf2] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-[#7440dc]">Total Amount</p>
            <p className="text-[20px] font-bold text-[#7440dc]">₹{order.amount}</p>
          </div>
          <button type="button" onClick={reorder} className="flex h-11 min-w-[140px] items-center justify-center gap-2 rounded-[12px] bg-[linear-gradient(100deg,#7138e2,#8d4df0)] px-5 text-[12px] font-bold text-white">
            <Package className="h-4 w-4" />
            Reorder
          </button>
        </div>
      </div>

      <CustomerBottomNav active="orders" />
    </div>
  );
}

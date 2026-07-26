"use client";

import { ArrowLeft, Check, ChevronRight, Headphones } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import type {
  PortalOrder,
  PortalOrderStatus,
} from "@/lib/customer-portal";
import { cn } from "@/lib/utils";

const steps: Array<{ status: PortalOrderStatus; label: string }> = [
  { status: "Picked Up", label: "Picked Up" },
  { status: "In Cleaning", label: "Cleaning" },
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

const statusMessage: Record<PortalOrderStatus, string> = {
  New: "Your order is confirmed and waiting for pickup.",
  "Picked Up": "Your clothes have been picked up.",
  "In Cleaning": "Your clothes are being cleaned with care.",
  Ready: "Your clothes are clean and ready for delivery.",
  "Out for Delivery": "Your order is on the way.",
  Delivered: "Your order has been delivered.",
  Cancelled: "This order was cancelled.",
};

export function TrackOrderView({ order }: { order: PortalOrder | null }) {
  if (!order) {
    return (
      <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
        <header className="border-b border-[#efedf5] bg-white">
          <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
            <Link href="/customer" aria-label="Back to home" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-[15px] font-bold">Track Order</h1>
          </div>
        </header>
        <main className="mx-auto max-w-[720px] px-4 py-16 text-center">
          <p className="text-[13px] font-bold">No active order</p>
          <Link href="/customer/services" className="mt-4 inline-flex h-10 items-center rounded-[10px] bg-[#7440dc] px-4 text-[11px] font-bold text-white">
            View Services
          </Link>
        </main>
        <CustomerBottomNav active="orders" />
      </div>
    );
  }

  const activeStep = steps.findIndex((step) => step.status === order.status);
  const latestEvent = order.timeline.at(-1);

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link
            href="/customer"
            aria-label="Back to home"
            className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">Track Order</h1>
          <Link
            href="/customer/help"
            className="absolute right-3 rounded-md px-2 py-1 text-[11px] font-bold text-[#7b45e5] hover:bg-[#f4efff]"
          >
            Help
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold">Order #{order.id}</h2>
        </div>

        <div className="relative mx-auto mt-2 flex h-[140px] max-w-[360px] items-center justify-center">
          <div className="absolute inset-x-4 bottom-2 h-14 rounded-full bg-[#f0eaff] blur-2xl" />
          <Image
            src="/ironwashing.png"
            alt="Laundry being prepared"
            width={170}
            height={170}
            className="relative h-[138px] w-[170px] object-contain"
            priority
          />
        </div>

        <ol className="mt-2 grid grid-cols-5">
          {steps.map((step, index) => {
            const complete = index < activeStep;
            const active = index === activeStep;
            return (
              <li key={step.status} className="relative flex min-w-0 flex-col items-center text-center">
                {index > 0 && (
                  <span
                    className={cn(
                      "absolute right-1/2 top-[11px] h-[2px] w-full",
                      index <= activeStep ? "bg-[#36bf67]" : "bg-[#d9d8e1]",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "relative z-10 flex h-[23px] w-[23px] items-center justify-center rounded-full border bg-white",
                    complete && "border-[#24b95b] bg-[#24b95b] text-white",
                    active && "border-[#7b42e7] bg-[#7b42e7] text-white",
                    index > activeStep && "border-[#c9c8d2] text-[#9293a0]",
                  )}
                >
                  {complete ? <Check className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                <span className="mt-2 text-[8px] font-semibold leading-tight text-[#4c4e60] sm:text-[10px]">
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <section className="mt-5 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3">
          <h2 className="text-[11px] font-bold">Current Status</h2>
          <p className="mt-3 text-[14px] font-bold">{order.status}</p>
          <p className="mt-2 text-[11px] leading-5 text-[#666879]">
            {statusMessage[order.status]}
            <br />
            {latestEvent ? formatDate(latestEvent.createdAt) : ""}
          </p>
        </section>

        <section className="mt-3 rounded-[12px] border border-[#e5e2eb] bg-white px-3 py-3">
          <h2 className="text-[11px] font-bold">Order Details</h2>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 text-[11px]">
            <dt className="text-[#77798a]">Order ID</dt>
            <dd className="font-semibold">{order.id}</dd>
            <dt className="text-[#77798a]">Order Date</dt>
            <dd className="font-semibold">{formatDate(order.createdAt)}</dd>
            <dt className="text-[#77798a]">Items</dt>
            <dd className="font-semibold">{order.itemCount} items</dd>
            <dt className="text-[#77798a]">Payment</dt>
            <dd className="font-semibold">{order.paymentStatus} ₹{order.amount}</dd>
          </dl>
          <Link
            href={`/customer/orders/${order.id}`}
            className="mt-3 flex items-center justify-between border-t border-[#eeecf2] pt-3 text-[11px] font-bold"
          >
            View Details
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        <Link
          href="/customer/help"
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[12px] bg-[#f1eaff] text-[11px] font-bold text-[#7040d7]"
        >
          <Headphones className="h-4 w-4" />
          Need Help? Contact Us
        </Link>
      </main>

      <CustomerBottomNav active="orders" />
    </div>
  );
}

"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import type { CustomerOrder, CustomerOrderStatus } from "@/lib/customer-orders";
import { cn } from "@/lib/utils";

const tabs = ["All", "Ongoing", "Completed", "Cancelled"] as const;

const statusClass: Record<CustomerOrderStatus, string> = {
  "In Progress": "bg-[#eee8ff] text-[#7040d7]",
  "Out for Delivery": "bg-[#fff0df] text-[#e26f14]",
  Delivered: "bg-[#e4f8e9] text-[#24964a]",
  Cancelled: "bg-[#fee9e9] text-[#d54a4a]",
};

export function MyOrdersView({ orders }: { orders: CustomerOrder[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("All");
  const visibleOrders = orders.filter((order) => {
    if (tab === "All") return true;
    if (tab === "Ongoing") return order.status === "In Progress" || order.status === "Out for Delivery";
    if (tab === "Completed") return order.status === "Delivered";
    return order.status === "Cancelled";
  });

  return (
    <div className="min-h-screen bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="sticky top-0 z-40 border-b border-[#efedf5] bg-white">
        <div className="relative mx-auto flex h-14 max-w-[720px] items-center justify-center px-4">
          <Link href="/customer" aria-label="Back to home" className="absolute left-3 flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#f4f1fb]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-[15px] font-bold">My Orders</h1>
        </div>
        <div className="mx-auto grid max-w-[720px] grid-cols-4 px-2">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={cn(
                "border-b-2 px-1 py-3 text-[10px] font-semibold",
                tab === item ? "border-[#8248ea] text-[#7440dc]" : "border-transparent text-[#858695]",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[720px] space-y-3 px-4 py-4">
        {visibleOrders.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-[#dcd8e7] bg-white px-4 py-10 text-center text-[12px] text-[#77798a]">
            No orders here
          </div>
        ) : (
          visibleOrders.map((order) => (
            <article key={order.id} className="rounded-[12px] border border-[#e4e1ea] bg-white px-3 py-3 shadow-[0_3px_10px_rgba(55,48,78,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("rounded-md px-2 py-1 text-[9px] font-bold", statusClass[order.status])}>{order.status}</span>
                <span className="text-[9px] text-[#858796]">{order.shortDate}</span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <div>
                  <Link href={`/customer/orders/${order.id}`} className="text-[12px] font-bold hover:text-[#7440dc]">{order.id}</Link>
                  <p className="mt-2 text-[10px] font-medium">{order.itemCount} items · {order.service}</p>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-bold">₹{order.amount}</p>
                  {order.paid && <span className="mt-1 inline-block rounded bg-[#e4f8e9] px-1.5 py-0.5 text-[8px] font-bold text-[#24964a]">Paid</span>}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-[10px]">
                <p><span className="text-[#77798a]">Pickup:</span> {order.pickup}</p>
                <p><span className="text-[#77798a]">Delivery:</span> {order.delivery}</p>
              </div>
              <Link href={`/customer/orders/${order.id}`} className="mt-3 flex items-center justify-between border-t border-[#eeecf2] pt-3 text-[10px] font-bold text-[#7440dc]">
                Track Order
                <ChevronRight className="h-4 w-4" />
              </Link>
            </article>
          ))
        )}
      </main>

      <CustomerBottomNav active="orders" />
    </div>
  );
}

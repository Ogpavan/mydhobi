"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, MapPin } from "lucide-react";

import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import type { AuthUser } from "@/lib/auth";
import type { ServiceCategory } from "@/lib/service-catalog";
import type { Offer } from "@/lib/offers";

type ActionItem = {
  label: string;
  image: string;
  href?: string;
};

const quickActions: ActionItem[] = [
  {
    label: "Schedule Pickup",
    image: "/schdule_pickup.png",
    href: "/customer/schedule",
  },
  {
    label: "Track Order",
    image: "/track_order.png",
    href: "/customer/track",
  },
  {
    label: "My Orders",
    image: "/my_orders.png",
    href: "/customer/orders",
  },
  {
    label: "Recharge Wallet",
    image: "/wallet.png",
    href: "/customer/wallet",
  },
];

export function CustomerDashboard({
  user,
  walletBalance,
  categories,
  location,
  unreadNotifications,
  offer,
}: {
  user: AuthUser;
  walletBalance: number;
  categories: ServiceCategory[];
  location: string;
  unreadNotifications: number;
  offer: Offer | null;
}) {
  const firstName = user.name.trim().split(/\s+/)[0] || "there";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fafafe] pb-[88px] text-[#17182c]">
      <header className="relative overflow-hidden bg-[#d9c6ff]">
        <Image
          src="/app_top_bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[96px] bg-gradient-to-b from-transparent via-[#fafafe]/40 to-[#fafafe] sm:h-[112px]"
        />
        <div className="relative z-10 mx-auto h-[238px] w-full max-w-[1120px] px-4 pt-[22px] sm:px-8 lg:h-[260px]">
          <div className="flex items-center justify-between">
            <Link
              href="/customer/addresses"
              className="flex min-w-0 items-center gap-2 rounded-full px-1 py-2 text-left text-[13px] font-semibold text-[#29263e] transition hover:bg-white/30"
            >
              <MapPin className="h-[18px] w-[18px] shrink-0" />
              <span className="truncate">{location}</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/customer/wallet"
                aria-label={`Wallet balance ₹${walletBalance.toFixed(2)}`}
                title="My Wallet"
                className="flex h-10 items-center rounded-full bg-white/35 px-3 text-[11px] font-bold text-[#29263e] transition hover:bg-white/55"
              >
                <span>₹{walletBalance.toFixed(0)}</span>
              </Link>
              <Link
                href="/customer/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/30 transition hover:bg-white/55"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-[21px] w-[21px]" />
                {unreadNotifications>0?<span className="absolute right-[3px] top-[2px] flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef3f55] px-1 text-[8px] font-bold text-white">{Math.min(unreadNotifications,9)}{unreadNotifications>9?"+":""}</span>:null}
              </Link>
            </div>
          </div>

          <div className="absolute bottom-[57px] left-4 z-10 sm:left-8">
            <h1 className="max-w-[220px] text-[25px] font-bold leading-tight tracking-[-0.03em] sm:text-[29px]">
              Hi {firstName} <span aria-hidden="true">👋</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-5 w-full max-w-[1120px] space-y-5 px-3 sm:-mt-7 sm:px-6">
        <section className="rounded-[12px] border border-[#eeecf7] bg-white px-3 py-5 shadow-[0_10px_32px_rgba(58,39,108,0.09)] sm:px-6">
          <div className="grid grid-cols-4 gap-1 sm:gap-4">
            {quickActions.map((action) => {
              const content = (
                <>
                  <span className="flex h-[50px] w-[50px] items-center justify-center transition group-hover:-translate-y-0.5">
                    <Image
                      src={action.image}
                      alt=""
                      width={50}
                      height={50}
                      className="h-[50px] w-[50px] object-contain"
                    />
                  </span>
                  <span className="mt-2 text-[11px] font-semibold leading-[1.25] text-[#323248] sm:text-[12px]">
                    {action.label}
                  </span>
                </>
              );
              const className =
                "group flex min-w-0 flex-col items-center rounded-xl px-0.5 py-1 text-center transition hover:bg-[#faf9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7c4fe5]";

              return (
                <Link key={action.label} href={action.href!} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </section>

        {offer?<Link
          href="/customer/offers"
          className="flex w-full items-center rounded-[12px] bg-[linear-gradient(105deg,#f5efff,#eee5ff)] px-4 py-4 text-left shadow-[inset_0_0_0_1px_rgba(126,78,220,0.05)] transition hover:brightness-[0.99]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[#7145d5]">
              {offer.title}
            </span>
            <span className="mt-2 block text-[12px] text-[#67627d]">
              Use code{" "}
              <strong className="rounded-md bg-white/65 px-1.5 py-1 font-bold text-[#794fe0]">
                {offer.code}
              </strong>
            </span>
          </span>
          <Image
            src="/gift_box.png"
            alt=""
            width={100}
            height={80}
            className="ml-2 h-[80px] w-[100px] shrink-0 object-contain"
          />
        </Link>:null}

        {categories.length > 0 ? <section>
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[14px] font-bold">Choose a garment</h2>
            <Link
              href="/customer/services"
              className="rounded-md px-2 py-1 text-[11px] font-bold text-[#7d50dd] hover:bg-[#f2edff]"
            >
              View All
            </Link>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                href={`/customer/services?category=${encodeURIComponent(category.id)}`}
                className="flex min-h-[124px] flex-col items-center justify-center gap-2.5 rounded-[12px] border border-[#e7e8f0] bg-white px-2 py-3 text-center shadow-[0_4px_12px_rgba(46,54,95,0.05)] transition hover:-translate-y-0.5 hover:border-[#d9d0f3]"
              >
                {category.imagePath ? (
                  <Image
                    src={category.imagePath}
                    alt=""
                    width={58}
                    height={58}
                    className="h-[58px] w-[58px] shrink-0 object-contain"
                  />
                ) : (
                  <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[10px] bg-[#f0eaff] text-[18px] font-bold text-[#7440dc]">
                    {category.name.slice(0, 1)}
                  </span>
                )}
                <span className="line-clamp-2 min-h-[28px] min-w-0 text-[12px] font-bold leading-[1.15]">{category.name}</span>
              </Link>
            ))}
          </div>
        </section> : null}

      </main>

      <CustomerBottomNav active="home" />
    </div>
  );
}

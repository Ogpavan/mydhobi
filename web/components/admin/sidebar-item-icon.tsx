"use client";

import Image from "next/image";
import { Boxes, MessageSquareWarning } from "lucide-react";

import { ReferenceSpriteIcon } from "@/components/admin/reference-sprite-icon";
import type { SidebarItemKey } from "@/lib/sidebar-settings-types";

const spriteIcons = {
  dashboard: "navDashboard",
  orders: "navOrders",
  customers: "navCustomers",
  pickups: "navPickups",
  deliveries: "navDeliveries",
  services: "navRateCard",
  riders: "navRiders",
  payments: "navPayments",
  offers: "navRateCard",
  referrals: "navCustomers",
  reports: "navReports",
  settings: "navSettings",
} as const;

export function SidebarItemIcon({
  itemKey,
  collapsed = false,
}: {
  itemKey: SidebarItemKey;
  collapsed?: boolean;
}) {
  if (itemKey === "store") {
    return (
      <Image
        src="/sidebar/store-icon.png"
        alt=""
        width={33}
        height={31}
        className={
          collapsed
            ? "h-[28px] w-[30px] shrink-0 object-contain"
            : "h-[31px] w-[33px] shrink-0 object-contain"
        }
      />
    );
  }

  if (itemKey === "inventory" || itemKey === "complaints") {
    const Icon = itemKey === "inventory" ? Boxes : MessageSquareWarning;
    return (
      <span
        className={
          collapsed
            ? "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded bg-[#EAF2FF] text-[#075DFF]"
            : "flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded bg-[#EAF2FF] text-[#075DFF]"
        }
        aria-hidden="true"
      >
        <Icon className={collapsed ? "h-[17px] w-[17px]" : "h-[19px] w-[19px]"} />
      </span>
    );
  }

  const sprite = spriteIcons[itemKey as keyof typeof spriteIcons];
  return sprite ? (
    <ReferenceSpriteIcon
      name={sprite}
      scale={collapsed ? 0.48 : 0.54}
    />
  ) : null;
}

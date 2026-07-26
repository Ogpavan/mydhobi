import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  SchedulePickupView,
  type PickupDateOption,
} from "@/components/customer/schedule-pickup-view";
import { listPortalAddresses } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: { absolute: "Schedule Pickup | MyDhobi" },
};

function getPickupDates(): PickupDateOption[] {
  const indiaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const parts = Object.fromEntries(indiaDate.map((part) => [part.type, part.value]));
  const start = new Date(
    Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)),
  );

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);

    return {
      id: date.toISOString().slice(0, 10),
      day: new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }).format(date),
      date: String(date.getUTCDate()),
      month: new Intl.DateTimeFormat("en-US", {
        month: "short",
        timeZone: "UTC",
      }).format(date),
    };
  });
}

export default async function SchedulePickupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const addresses = await listPortalAddresses(user.id);
  const address = addresses[0];
  const pickupAddress = address
    ? [
        address.fullAddress,
        address.landmark,
        address.city,
        address.pincode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";
  return (
    <SchedulePickupView
      dates={getPickupDates()}
      pickupAddress={pickupAddress}
    />
  );
}

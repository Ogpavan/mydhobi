import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import {
  SchedulePickupView,
  type PickupDateOption,
} from "@/components/customer/schedule-pickup-view";
import type { PortalAddress } from "@/lib/customer-portal";
import { useMemo } from "react";
type AddressesResponse = { addresses: PortalAddress[] };
function pickupDates(): PickupDateOption[] {
  const start = new Date();
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      id: date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
      day: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      }),
      date: date.toLocaleDateString("en-US", {
        day: "numeric",
        timeZone: "Asia/Kolkata",
      }),
      month: date.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "Asia/Kolkata",
      }),
    };
  });
}
export function CustomerScheduleClient() {
  const addresses = useCustomerData<AddressesResponse>(
    "/api/customer/addresses",
    15_000,
  );
  const dates = useMemo(pickupDates, []);
  if (addresses.loading)
    return <CustomerPageSkeleton variant="form" rows={4} />;
  if (addresses.error)
    return (
      <CustomerPageError message={addresses.error} retry={addresses.retry} />
    );
  const address = addresses.data?.addresses[0];
  const pickupAddress = address
    ? [address.fullAddress, address.landmark, address.city, address.pincode]
        .filter(Boolean)
        .join(", ")
    : "";
  return (
    <SchedulePickupView
      dates={dates}
      pickupAddress={pickupAddress}
      pickupAddressId={address?.id ?? ""}
    />
  );
}

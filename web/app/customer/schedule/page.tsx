import type { Metadata } from "next";

import { CustomerScheduleClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = {
  title: { absolute: "Schedule Pickup | MyDhobi" },
};

export default function SchedulePickupPage() {
  return <CustomerScheduleClient />;
}

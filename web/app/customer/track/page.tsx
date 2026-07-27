import type { Metadata } from "next";

import { CustomerTrackClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = { title: { absolute: "Track Order | MyDhobi" } };

export default function TrackOrderPage() {
  return <CustomerTrackClient />;
}

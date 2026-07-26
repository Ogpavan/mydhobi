import type { Metadata } from "next";

import { TrackOrderView } from "@/components/customer/track-order-view";
import { listPortalOrders } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: { absolute: "Track Order | MyDhobi" } };

export default async function TrackOrderPage() {
  const user = await getCurrentUser();
  const order = user ? (await listPortalOrders(user.id))[0] ?? null : null;
  return <TrackOrderView order={order} />;
}

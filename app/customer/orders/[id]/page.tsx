import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OrderDetailsView } from "@/components/customer/order-details-view";
import { getPortalOrder } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: { absolute: "Order Details | MyDhobi" } };

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const { id } = await params;
  const order = await getPortalOrder(user.id, id);
  if (!order) notFound();
  return <OrderDetailsView order={order} />;
}

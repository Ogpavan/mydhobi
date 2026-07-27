import { notFound } from "next/navigation";

import { AdminOrderDetails } from "@/components/admin/orders-admin";
import { getAdminOrder } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();
  return <AdminOrderDetails initialOrder={order} />;
}

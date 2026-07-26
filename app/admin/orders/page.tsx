import { AdminOrdersList } from "@/components/admin/orders-admin";
import { getAdminOrderStats, listAdminOrders } from "@/lib/admin-orders";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const [orders, stats] = await Promise.all([
    listAdminOrders(),
    getAdminOrderStats(),
  ]);
  return <AdminOrdersList initialOrders={orders} stats={stats} />;
}

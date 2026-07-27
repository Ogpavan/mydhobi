import { AdminDeliveries } from "@/components/admin/deliveries-admin";
import {
  getDeliveryStats,
  listDeliveryRiders,
  listDeliveryTasks,
} from "@/lib/deliveries";

export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const [deliveries, riders, stats] = await Promise.all([
    listDeliveryTasks(),
    listDeliveryRiders(),
    getDeliveryStats(),
  ]);
  return (
    <AdminDeliveries
      initialDeliveries={deliveries}
      riders={riders}
      stats={stats}
    />
  );
}

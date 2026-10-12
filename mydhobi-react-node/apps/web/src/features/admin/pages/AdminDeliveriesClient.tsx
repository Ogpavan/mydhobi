import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminDeliveries } from "@/components/admin/deliveries-admin";
import type { DeliveryStats, DeliveryTask } from "@/lib/deliveries";
import type { PickupRider } from "@/lib/pickups";
export function AdminDeliveriesClient() {
  const result = useAdminPageData<{
    deliveries: DeliveryTask[];
    riders: PickupRider[];
    stats: DeliveryStats;
  }>("key=deliveries");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminDeliveries
      initialDeliveries={result.data.deliveries}
      riders={result.data.riders}
      stats={result.data.stats}
    />
  );
}

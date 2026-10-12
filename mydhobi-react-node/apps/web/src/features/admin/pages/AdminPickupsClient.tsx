import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminPickups } from "@/components/admin/pickups-admin";
import type { PickupRider, PickupStats, PickupTask } from "@/lib/pickups";
export function AdminPickupsClient() {
  const result = useAdminPageData<{
    pickups: PickupTask[];
    riders: PickupRider[];
    stats: PickupStats;
  }>("key=pickups");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminPickups
      initialPickups={result.data.pickups}
      riders={result.data.riders}
      stats={result.data.stats}
    />
  );
}

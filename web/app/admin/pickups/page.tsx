import { AdminPickups } from "@/components/admin/pickups-admin";
import {
  getPickupStats,
  listPickupRiders,
  listPickupTasks,
} from "@/lib/pickups";

export const dynamic = "force-dynamic";

export default async function PickupsPage() {
  const [pickups, riders, stats] = await Promise.all([
    listPickupTasks(),
    listPickupRiders(),
    getPickupStats(),
  ]);
  return (
    <AdminPickups
      initialPickups={pickups}
      riders={riders}
      stats={stats}
    />
  );
}

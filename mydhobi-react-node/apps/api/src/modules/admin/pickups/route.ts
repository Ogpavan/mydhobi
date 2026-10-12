import { HttpResponse } from "@/server/http-response";

import {
  getPickupStats,
  listPickupRiders,
  listPickupTasks,
} from "@/lib/pickups";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "pickups"))) {
    return HttpResponse.json(
      { message: "You do not have access to pickups." },
      { status: 403 },
    );
  }
  const [pickups, riders, stats] = await Promise.all([
    listPickupTasks(user.role === "store_manager" ? user.storeId : null),
    listPickupRiders(user.role === "store_manager" ? user.storeId : null),
    getPickupStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return HttpResponse.json({ pickups, riders, stats });
}

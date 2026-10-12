import { HttpResponse } from "@/server/http-response";

import {
  getDeliveryStats,
  listDeliveryRiders,
  listDeliveryTasks,
} from "@/lib/deliveries";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "deliveries"))) {
    return HttpResponse.json(
      { message: "You do not have access to deliveries." },
      { status: 403 },
    );
  }
  const [deliveries, riders, stats] = await Promise.all([
    listDeliveryTasks(user.role === "store_manager" ? user.storeId : null),
    listDeliveryRiders(user.role === "store_manager" ? user.storeId : null),
    getDeliveryStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return HttpResponse.json({ deliveries, riders, stats });
}

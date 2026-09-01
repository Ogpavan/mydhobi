import { NextResponse } from "next/server";

import {
  getDeliveryStats,
  listDeliveryRiders,
  listDeliveryTasks,
} from "@/lib/deliveries";
import { getCurrentUser } from "@/lib/session";
import { canAccessAdminPage } from "@/lib/role-permissions";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "deliveries"))) {
    return NextResponse.json({ message: "You do not have access to deliveries." }, { status: 403 });
  }
  const [deliveries, riders, stats] = await Promise.all([
    listDeliveryTasks(user.role === "store_manager" ? user.storeId : null),
    listDeliveryRiders(user.role === "store_manager" ? user.storeId : null),
    getDeliveryStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return NextResponse.json({ deliveries, riders, stats });
}

import { NextResponse } from "next/server";

import { getAdminOrderStats, listAdminOrders } from "@/lib/admin-orders";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [orders, stats] = await Promise.all([
    listAdminOrders(user.role === "store_manager" ? user.storeId : null),
    getAdminOrderStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return NextResponse.json({ orders, stats });
}

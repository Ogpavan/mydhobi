import { NextResponse } from "next/server";

import {
  getDeliveryStats,
  listDeliveryRiders,
  listDeliveryTasks,
} from "@/lib/deliveries";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [deliveries, riders, stats] = await Promise.all([
    listDeliveryTasks(),
    listDeliveryRiders(),
    getDeliveryStats(),
  ]);
  return NextResponse.json({ deliveries, riders, stats });
}

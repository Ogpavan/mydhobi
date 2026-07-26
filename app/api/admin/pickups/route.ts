import { NextResponse } from "next/server";

import {
  getPickupStats,
  listPickupRiders,
  listPickupTasks,
} from "@/lib/pickups";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [pickups, riders, stats] = await Promise.all([
    listPickupTasks(),
    listPickupRiders(),
    getPickupStats(),
  ]);
  return NextResponse.json({ pickups, riders, stats });
}

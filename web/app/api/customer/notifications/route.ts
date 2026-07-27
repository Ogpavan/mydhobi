import { NextResponse } from "next/server";

import {
  listPortalNotifications,
  markPortalNotificationsRead,
} from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ notifications: await listPortalNotifications(user.id) });
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await markPortalNotificationsRead(user.id);
  return NextResponse.json({ success: true });
}

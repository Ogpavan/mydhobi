import { NextResponse } from "next/server";

import {
  getCustomerSettings,
  updateCustomerSettings,
} from "@/lib/customer-settings";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

async function customer() {
  const user = await getCurrentUser();
  return user?.role === "customer" ? user : null;
}

export async function GET() {
  const user = await customer();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ settings: await getCustomerSettings(user.id) });
}

export async function PATCH(request: Request) {
  const user = await customer();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  if (
    typeof body.notificationsEnabled !== "boolean" ||
    typeof body.darkMode !== "boolean"
  ) {
    return NextResponse.json(
      { message: "Check the settings." },
      { status: 400 },
    );
  }
  const settings = await updateCustomerSettings(user.id, {
    notificationsEnabled: body.notificationsEnabled,
    darkMode: body.darkMode,
  });
  return NextResponse.json({ settings });
}

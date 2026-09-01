import { NextResponse } from "next/server";

import { getPaymentStats, listPayments } from "@/lib/payments";
import { getCurrentUser } from "@/lib/session";
import { canAccessAdminPage } from "@/lib/role-permissions";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "payments"))) {
    return NextResponse.json({ message: "You do not have access to payments." }, { status: 403 });
  }
  const [payments, stats] = await Promise.all([
    listPayments(user.role === "store_manager" ? user.storeId : null),
    getPaymentStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return NextResponse.json({ payments, stats });
}

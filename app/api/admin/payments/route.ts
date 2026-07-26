import { NextResponse } from "next/server";

import { getPaymentStats, listPayments } from "@/lib/payments";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [payments, stats] = await Promise.all([
    listPayments(),
    getPaymentStats(),
  ]);
  return NextResponse.json({ payments, stats });
}

import { NextResponse } from "next/server";

import { getReportData, normalizeReportRange } from "@/lib/reports";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const range = normalizeReportRange(new URL(request.url).searchParams.get("range"));
  return NextResponse.json({
    report: await getReportData(range, user.role === "store_manager" ? user.storeId : null),
  });
}

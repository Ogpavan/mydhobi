import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { getComplaintStats, listComplaints } from "@/lib/support";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const [complaints, stats] = await Promise.all([
    listComplaints(),
    getComplaintStats(),
  ]);
  return NextResponse.json({ complaints, stats });
}

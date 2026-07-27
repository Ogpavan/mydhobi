import { NextResponse } from "next/server";

import { listReferrals } from "@/lib/referrals";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ referrals: await listReferrals() });
}

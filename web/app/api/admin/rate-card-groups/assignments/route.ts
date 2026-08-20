import { NextResponse } from "next/server";

import { assignRateCardToStore, listRateCardStoreAssignments } from "@/lib/rate-card-groups";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ assignments: await listRateCardStoreAssignments() });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const storeId = typeof body.storeId === "string" ? body.storeId : "";
    const groupId = body.groupId === null || body.groupId === "" || body.groupId === undefined ? null : Number(body.groupId);
    if (!storeId || (groupId !== null && (!Number.isInteger(groupId) || groupId < 1))) return NextResponse.json({ message: "Choose a store and tariff card." }, { status: 400 });
    await assignRateCardToStore(storeId, groupId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to assign tariff card." }, { status: 400 });
  }
}

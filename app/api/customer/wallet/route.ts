import { NextResponse } from "next/server";

import { addPortalMoney, getPortalWallet } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ wallet: await getPortalWallet(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json() as Record<string, unknown>;
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 50000) {
    return NextResponse.json({ message: "Enter an amount from ₹1 to ₹50,000." }, { status: 400 });
  }
  return NextResponse.json({ wallet: await addPortalMoney(user.id, amount) }, { status: 201 });
}

import { NextResponse } from "next/server";

import { listOffers, validateOffer } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ offers: await listOffers(true) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const subtotal = Number(body.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ message: "Enter a coupon code." }, { status: 400 });
  const result = await validateOffer(code, subtotal);
  return result.valid
    ? NextResponse.json(result)
    : NextResponse.json({ message: result.message }, { status: 400 });
}

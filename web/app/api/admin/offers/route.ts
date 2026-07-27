import { NextResponse } from "next/server";

import { createOffer, listOffers, parseOfferInput } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ offers: await listOffers() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const input = parseOfferInput(await request.json() as Record<string, unknown>);
    if (!input) return NextResponse.json({ message: "Check the offer details." }, { status: 400 });
    return NextResponse.json({ offer: await createOffer(input) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "This coupon code already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Unable to create offer." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import {
  createOffer,
  listOffers,
  parseOfferInput,
  validateOfferAgainstPolicy,
} from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";
import { getStoreDiscountPolicy } from "@/lib/stores";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role === "store_manager") {
    if (!user.storeId) return NextResponse.json({ message: "Store is not assigned." }, { status: 403 });
    return NextResponse.json({ offers: await listOffers(false, user.storeId) });
  }
  return NextResponse.json({ offers: await listOffers() });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const input = parseOfferInput(await request.json() as Record<string, unknown>);
    if (!input) return NextResponse.json({ message: "Check the offer details." }, { status: 400 });
    if (user.role === "store_manager") {
      if (!user.storeId) return NextResponse.json({ message: "Store is not assigned." }, { status: 403 });
      const policy = await getStoreDiscountPolicy(user.storeId);
      if (!policy) return NextResponse.json({ message: "Store not found." }, { status: 404 });
      const policyError = validateOfferAgainstPolicy(input, policy);
      if (policyError) return NextResponse.json({ message: policyError }, { status: 400 });
      return NextResponse.json({
        offer: await createOffer(input, {
          storeId: user.storeId,
          userId: user.id,
          role: user.role,
        }),
      }, { status: 201 });
    }
    return NextResponse.json({ offer: await createOffer(input) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "This coupon code already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Unable to create offer." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import {
  deleteOffer,
  getOfferById,
  parseOfferInput,
  updateOffer,
  validateOfferAgainstPolicy,
} from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";
import { getStoreDiscountPolicy } from "@/lib/stores";

async function currentUser() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const id = (await params).id;
    const existing = await getOfferById(id);
    if (!existing) return NextResponse.json({ message: "Offer not found." }, { status: 404 });
    if (user.role === "store_manager" && (!user.storeId || existing.storeId !== user.storeId)) {
      return NextResponse.json({ message: "You cannot change this offer." }, { status: 403 });
    }
    if (user.role === "staff" && existing.storeId) {
      return NextResponse.json({ message: "You cannot change this store offer." }, { status: 403 });
    }
    const input = parseOfferInput(await request.json() as Record<string, unknown>);
    if (!input) return NextResponse.json({ message: "Check the offer details." }, { status: 400 });
    if (existing.storeId) {
      const policy = await getStoreDiscountPolicy(existing.storeId);
      if (!policy) return NextResponse.json({ message: "Store not found." }, { status: 404 });
      const policyError = validateOfferAgainstPolicy(input, policy);
      if (policyError) return NextResponse.json({ message: policyError }, { status: 400 });
    }
    const offer = await updateOffer(id, input);
    return offer ? NextResponse.json({ offer }) : NextResponse.json({ message: "Offer not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "This coupon code already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update offer." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = (await params).id;
  const existing = await getOfferById(id);
  if (!existing) return NextResponse.json({ message: "Offer not found." }, { status: 404 });
  if (user.role === "store_manager" && (!user.storeId || existing.storeId !== user.storeId)) {
    return NextResponse.json({ message: "You cannot delete this offer." }, { status: 403 });
  }
  if (user.role === "staff" && existing.storeId) {
    return NextResponse.json({ message: "You cannot delete this store offer." }, { status: 403 });
  }
  return await deleteOffer(id)
    ? NextResponse.json({ success: true })
    : NextResponse.json({ message: "Offer not found." }, { status: 404 });
}

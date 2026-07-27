import { NextResponse } from "next/server";

import { deleteOffer, parseOfferInput, updateOffer } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";

async function allowed() {
  const user = await getCurrentUser();
  return user && user.role !== "customer";
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await allowed()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const input = parseOfferInput(await request.json() as Record<string, unknown>);
    if (!input) return NextResponse.json({ message: "Check the offer details." }, { status: 400 });
    const offer = await updateOffer((await params).id, input);
    return offer ? NextResponse.json({ offer }) : NextResponse.json({ message: "Offer not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "This coupon code already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update offer." }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await allowed()) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return await deleteOffer((await params).id)
    ? NextResponse.json({ success: true })
    : NextResponse.json({ message: "Offer not found." }, { status: 404 });
}

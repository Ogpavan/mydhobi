import { HttpResponse } from "@/server/http-response";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const id = (await params).id;
    const existing = await getOfferById(id);
    if (!existing)
      return HttpResponse.json(
        { message: "Offer not found." },
        { status: 404 },
      );
    if (
      user.role === "store_manager" &&
      (!user.storeId || existing.storeId !== user.storeId)
    ) {
      return HttpResponse.json(
        { message: "You cannot change this offer." },
        { status: 403 },
      );
    }
    if (user.role === "staff" && existing.storeId) {
      return HttpResponse.json(
        { message: "You cannot change this store offer." },
        { status: 403 },
      );
    }
    const input = parseOfferInput(
      (await request.json()) as Record<string, unknown>,
    );
    if (!input)
      return HttpResponse.json(
        { message: "Check the offer details." },
        { status: 400 },
      );
    if (existing.storeId) {
      const policy = await getStoreDiscountPolicy(existing.storeId);
      if (!policy)
        return HttpResponse.json(
          { message: "Store not found." },
          { status: 404 },
        );
      const policyError = validateOfferAgainstPolicy(input, policy);
      if (policyError)
        return HttpResponse.json({ message: policyError }, { status: 400 });
    }
    const offer = await updateOffer(id, input);
    return offer
      ? HttpResponse.json({ offer })
      : HttpResponse.json({ message: "Offer not found." }, { status: 404 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "23505"
    )
      return HttpResponse.json(
        { message: "This coupon code already exists." },
        { status: 409 },
      );
    return HttpResponse.json(
      { message: "Unable to update offer." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = (await params).id;
  const existing = await getOfferById(id);
  if (!existing)
    return HttpResponse.json({ message: "Offer not found." }, { status: 404 });
  if (
    user.role === "store_manager" &&
    (!user.storeId || existing.storeId !== user.storeId)
  ) {
    return HttpResponse.json(
      { message: "You cannot delete this offer." },
      { status: 403 },
    );
  }
  if (user.role === "staff" && existing.storeId) {
    return HttpResponse.json(
      { message: "You cannot delete this store offer." },
      { status: 403 },
    );
  }
  return (await deleteOffer(id))
    ? HttpResponse.json({ success: true })
    : HttpResponse.json({ message: "Offer not found." }, { status: 404 });
}

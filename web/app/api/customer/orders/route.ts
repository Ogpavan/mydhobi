import { NextResponse } from "next/server";

import { createPortalOrder, getPortalAddress, listPortalOrders, type PortalOrderItem } from "@/lib/customer-portal";
import { DEFECT_TYPES, FABRIC_TYPES, PACKING_TYPES } from "@/lib/customer-cart";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ orders: await listPortalOrders(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json() as Record<string, unknown>;
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const idempotencyKey = request.headers.get("Idempotency-Key")?.trim() ?? "";
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      return NextResponse.json({ message: "Please try placing the order again." }, { status: 400 });
    }
    if (rawItems.length < 1 || rawItems.length > 50) {
      return NextResponse.json({ message: "Add between 1 and 50 items." }, { status: 400 });
    }
    const items: PortalOrderItem[] = rawItems.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const record = item as Record<string, unknown>;
      const quantity = Number(record.quantity);
      const optionalText = (key: string, maxLength: number) => {
        const value = record[key];
        if (value === undefined || value === null) return "";
        return typeof value === "string" && value.trim().length <= maxLength ? value.trim() : null;
      };
      const garmentId = optionalText("garmentId", 30);
      const serviceId = optionalText("serviceId", 30);
      const alias = optionalText("alias", 120);
      const packingType = optionalText("packingType", 40);
      const brand = optionalText("brand", 80);
      const fabric = optionalText("fabric", 40);
      const defect = optionalText("defect", 80);
      const color = optionalText("color", 40);
      const remark = optionalText("remark", 160);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100 ||
          garmentId === null || serviceId === null ||
          !/^\d+$/.test(garmentId) || !/^\d+$/.test(serviceId) ||
          alias === null || packingType === null || brand === null || fabric === null || defect === null ||
          color === null || remark === null ||
          (packingType && !PACKING_TYPES.includes(packingType as typeof PACKING_TYPES[number])) ||
          (fabric && !FABRIC_TYPES.includes(fabric as typeof FABRIC_TYPES[number])) ||
          (defect && !DEFECT_TYPES.includes(defect as typeof DEFECT_TYPES[number])) ) {
        return [];
      }
      return [{
        name: "",
        quantity,
        unitPrice: 0,
        garmentId,
        serviceId,
        ...(alias ? { alias } : {}),
        ...(packingType ? { packingType } : {}),
        ...(brand ? { brand } : {}),
        ...(fabric ? { fabric } : {}),
        ...(defect ? { defect } : {}),
        ...(color ? { color } : {}),
        ...(remark ? { remark } : {}),
      }];
    });
    const service = typeof body.service === "string" ? body.service.trim() : "";
    const addressId = typeof body.addressId === "string" && /^\d+$/.test(body.addressId)
      ? body.addressId
      : "";
    const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "";
    const pickupAt = typeof body.pickupAt === "string" ? body.pickupAt : "";
    const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
    if (!items.length || items.length !== rawItems.length) {
      return NextResponse.json({ message: "Add at least one valid item." }, { status: 400 });
    }
    const savedAddress = addressId ? await getPortalAddress(user.id, addressId) : null;
    if (service.length > 80 || !savedAddress) {
      return NextResponse.json({ message: "Pickup address is required." }, { status: 400 });
    }
    const address = [
      savedAddress.fullAddress,
      savedAddress.landmark,
      savedAddress.city,
      savedAddress.pincode,
    ].filter(Boolean).join(", ");
    if (instructions.length > 120) {
      return NextResponse.json({ message: "Instructions must be 120 characters or less." }, { status: 400 });
    }
    if (!["upi", "wallet", "card", "cash"].includes(paymentMethod)) {
      return NextResponse.json({ message: "Select a payment method." }, { status: 400 });
    }
    const pickupDate = new Date(pickupAt);
    const earliestPickup = Date.now() + 30 * 60 * 1000;
    const latestPickup = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (Number.isNaN(pickupDate.getTime()) || pickupDate.getTime() < earliestPickup || pickupDate.getTime() > latestPickup) {
      return NextResponse.json({ message: "Select a valid pickup time." }, { status: 400 });
    }
    const order = await createPortalOrder(user.id, {
      service,
      address,
      instructions,
      idempotencyKey,
      paymentMethod,
      pickupAt: pickupDate.toISOString(),
      items,
      ...(couponCode ? { couponCode } : {}),
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_WALLET_BALANCE") {
      return NextResponse.json({ message: "Not enough wallet balance." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "INVALID_COUPON") {
      return NextResponse.json({ message: "Coupon is no longer valid." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "ITEM_SERVICE_PRICE_NOT_FOUND") {
      return NextResponse.json({ message: "This item and service price is not available." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "STORE_NOT_AVAILABLE") {
      return NextResponse.json({ message: "No store is available for this order." }, { status: 400 });
    }
    if (error instanceof Error && error.message === "REFERRAL_NOT_AVAILABLE") {
      return NextResponse.json({ message: "Referral discount is no longer available." }, { status: 400 });
    }
    console.error("Create customer order failed", error);
    return NextResponse.json({ message: "Unable to place order." }, { status: 500 });
  }
}

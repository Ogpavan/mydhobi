import { NextResponse } from "next/server";

import { createPortalOrder, listPortalOrders, type PortalOrderItem } from "@/lib/customer-portal";
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
    const items: PortalOrderItem[] = rawItems.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const record = item as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name.trim() : "";
      const quantity = Number(record.quantity);
      const unitPrice = Number(record.unitPrice);
      const optionalText = (key: string, maxLength: number) => {
        const value = record[key];
        if (value === undefined || value === null) return "";
        return typeof value === "string" && value.trim().length <= maxLength ? value.trim() : null;
      };
      const garmentId = optionalText("garmentId", 30);
      const garmentName = optionalText("garmentName", 100);
      const serviceId = optionalText("serviceId", 30);
      const serviceName = optionalText("serviceName", 100);
      const alias = optionalText("alias", 120);
      const packingType = optionalText("packingType", 40);
      const brand = optionalText("brand", 80);
      const fabric = optionalText("fabric", 40);
      const defect = optionalText("defect", 80);
      if (!name || name.length > 100 || !Number.isInteger(quantity) || quantity < 1 ||
          quantity > 100 || !Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 100000 ||
          garmentId === null || garmentName === null || serviceId === null || serviceName === null ||
          (garmentId !== "" && !/^\d+$/.test(garmentId)) || (serviceId !== "" && !/^\d+$/.test(serviceId)) ||
          alias === null || packingType === null || brand === null || fabric === null || defect === null ||
          (packingType && !PACKING_TYPES.includes(packingType as typeof PACKING_TYPES[number])) ||
          (fabric && !FABRIC_TYPES.includes(fabric as typeof FABRIC_TYPES[number])) ||
          (defect && !DEFECT_TYPES.includes(defect as typeof DEFECT_TYPES[number])) ) {
        return [];
      }
      return [{
        name,
        quantity,
        unitPrice,
        ...(garmentId ? { garmentId } : {}),
        ...(garmentName ? { garmentName } : {}),
        ...(serviceId ? { serviceId } : {}),
        ...(serviceName ? { serviceName } : {}),
        ...(alias ? { alias } : {}),
        ...(packingType ? { packingType } : {}),
        ...(brand ? { brand } : {}),
        ...(fabric ? { fabric } : {}),
        ...(defect ? { defect } : {}),
      }];
    });
    const service = typeof body.service === "string" ? body.service.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const instructions = typeof body.instructions === "string" ? body.instructions.trim() : "";
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod : "";
    const pickupAt = typeof body.pickupAt === "string" ? body.pickupAt : "";
    const couponCode = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";
    if (!items.length || items.length !== rawItems.length) {
      return NextResponse.json({ message: "Add at least one valid item." }, { status: 400 });
    }
    if (!service || service.length > 80 || !address || address.length > 500) {
      return NextResponse.json({ message: "Service and address are required." }, { status: 400 });
    }
    if (instructions.length > 120) {
      return NextResponse.json({ message: "Instructions must be 120 characters or less." }, { status: 400 });
    }
    if (!["upi", "wallet", "card", "cash"].includes(paymentMethod)) {
      return NextResponse.json({ message: "Select a payment method." }, { status: 400 });
    }
    const pickupDate = new Date(pickupAt);
    if (Number.isNaN(pickupDate.getTime())) {
      return NextResponse.json({ message: "Select a valid pickup time." }, { status: 400 });
    }
    const order = await createPortalOrder(user.id, {
      service,
      address,
      instructions,
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
    console.error("Create customer order failed", error);
    return NextResponse.json({ message: "Unable to place order." }, { status: 500 });
  }
}

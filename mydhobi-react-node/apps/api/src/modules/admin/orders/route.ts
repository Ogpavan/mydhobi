import { HttpResponse } from "@/server/http-response";

import {
  createAdminBooking,
  type AdminBookingItemInput,
} from "@/lib/admin-order-booking";
import { getAdminOrderStats, listAdminOrders } from "@/lib/admin-orders";
import { DEFECT_TYPES, FABRIC_TYPES, PACKING_TYPES } from "@/lib/customer-cart";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return HttpResponse.json(
      { message: "You do not have access to orders." },
      { status: 403 },
    );
  }

  const [orders, stats] = await Promise.all([
    listAdminOrders(user.role === "store_manager" ? user.storeId : null),
    getAdminOrderStats(user.role === "store_manager" ? user.storeId : null),
  ]);
  return HttpResponse.json({ orders, stats });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role === "customer" ||
    (user.role === "store_manager" && !user.storeId)
  ) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return HttpResponse.json(
      { message: "You do not have access to orders." },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const customerId =
      typeof body.customerId === "string" ? body.customerId.trim() : "";
    const tariffId = Number(body.tariffId);
    const bookingType = body.bookingType === "package" ? "package" : "general";
    const pickupAt = typeof body.pickupAt === "string" ? body.pickupAt : "";
    const paymentMethod =
      body.paymentMethod === "upi" || body.paymentMethod === "card"
        ? body.paymentMethod
        : "cash";
    const instructions =
      typeof body.instructions === "string" ? body.instructions.trim() : "";
    const idempotencyKey =
      typeof body.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
    const rawChargeCodes = body.chargeCodes;
    const chargeCodes = Array.isArray(rawChargeCodes)
      ? rawChargeCodes.filter(
          (code): code is string =>
            typeof code === "string" && /^[a-z][a-z0-9_]{1,49}$/.test(code),
        )
      : [];
    const customChargeAmount =
      body.customChargeAmount === null ||
      body.customChargeAmount === undefined ||
      body.customChargeAmount === ""
        ? null
        : Number(body.customChargeAmount);
    const rawItems = Array.isArray(body.items) ? body.items : [];

    if (!/^\d+$/.test(customerId)) {
      return HttpResponse.json(
        { message: "Choose a customer." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(tariffId) || tariffId < 1) {
      return HttpResponse.json(
        { message: "Choose a tariff." },
        { status: 400 },
      );
    }
    if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      return HttpResponse.json(
        { message: "Please try placing the order again." },
        { status: 400 },
      );
    }
    if (instructions.length > 120) {
      return HttpResponse.json(
        { message: "Instructions must be 120 characters or less." },
        { status: 400 },
      );
    }
    if (
      (Array.isArray(rawChargeCodes) &&
        chargeCodes.length !== rawChargeCodes.length) ||
      chargeCodes.length > 20 ||
      (customChargeAmount !== null &&
        (!Number.isFinite(customChargeAmount) ||
          customChargeAmount < 0 ||
          customChargeAmount > 100000))
    ) {
      return HttpResponse.json(
        { message: "Check the selected charges." },
        { status: 400 },
      );
    }
    const pickupDate = new Date(pickupAt);
    const earliestPickup = Date.now() + 15 * 60 * 1000;
    const latestPickup = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (
      Number.isNaN(pickupDate.getTime()) ||
      pickupDate.getTime() < earliestPickup ||
      pickupDate.getTime() > latestPickup
    ) {
      return HttpResponse.json(
        { message: "Choose a valid pickup time." },
        { status: 400 },
      );
    }
    if (rawItems.length < 1 || rawItems.length > 50) {
      return HttpResponse.json(
        { message: "Add between 1 and 50 items." },
        { status: 400 },
      );
    }

    const items: AdminBookingItemInput[] = [];
    for (const rawItem of rawItems) {
      if (!rawItem || typeof rawItem !== "object") {
        return HttpResponse.json(
          { message: "An order item is not valid." },
          { status: 400 },
        );
      }
      const item = rawItem as Record<string, unknown>;
      const garmentId = Number(item.garmentId);
      const serviceId = Number(item.serviceId);
      const quantity = Number(item.quantity);
      const optionalText = (key: string, maxLength: number) => {
        const value = item[key];
        return typeof value === "string" && value.trim().length <= maxLength
          ? value.trim()
          : "";
      };
      const packingType = optionalText("packingType", 40);
      const brand = optionalText("brand", 80);
      const fabric = optionalText("fabric", 40);
      const defect = optionalText("defect", 80) || "None";
      const color = optionalText("color", 40);
      const remark = optionalText("remark", 160);
      const validQuantity =
        bookingType === "general"
          ? Number.isInteger(quantity) && quantity >= 1 && quantity <= 100
          : Number.isFinite(quantity) && quantity > 0 && quantity <= 1000;
      if (
        !Number.isInteger(garmentId) ||
        garmentId < 1 ||
        !Number.isInteger(serviceId) ||
        serviceId < 1 ||
        !validQuantity ||
        (packingType &&
          !PACKING_TYPES.includes(
            packingType as (typeof PACKING_TYPES)[number],
          )) ||
        (fabric &&
          !FABRIC_TYPES.includes(fabric as (typeof FABRIC_TYPES)[number])) ||
        !DEFECT_TYPES.includes(defect as (typeof DEFECT_TYPES)[number])
      ) {
        return HttpResponse.json(
          { message: "An order item is not valid." },
          { status: 400 },
        );
      }
      items.push({
        garmentId,
        serviceId,
        quantity,
        packingType,
        brand,
        fabric,
        defect,
        color,
        remark,
      });
    }

    const order = await createAdminBooking(
      {
        customerId,
        tariffId,
        bookingType,
        pickupAt: pickupDate.toISOString(),
        paymentMethod,
        instructions,
        idempotencyKey,
        chargeCodes: [...new Set(chargeCodes)],
        customChargeAmount,
        items,
      },
      user.role === "store_manager" ? user.storeId : null,
    );
    return HttpResponse.json({ order }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const messages: Record<string, string> = {
      CUSTOMER_NOT_FOUND: "Customer not found.",
      CUSTOMER_MOBILE_IN_USE: "This mobile number is used by another login.",
      TARIFF_NOT_FOUND: "Tariff not found.",
      TARIFF_NOT_ASSIGNED: "This tariff is not assigned to your store.",
      STORE_NOT_AVAILABLE: "No store is available for this order.",
      ITEM_PRICE_NOT_FOUND:
        "An item price is no longer available in this tariff.",
      INVALID_ORDER_CHARGE: "A selected charge is no longer available.",
    };
    console.error("Create admin order failed", error);
    return HttpResponse.json(
      { message: messages[code] ?? "Unable to place order." },
      { status: messages[code] ? 400 : 500 },
    );
  }
}

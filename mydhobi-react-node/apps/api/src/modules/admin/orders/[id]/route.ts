import { HttpResponse } from "@/server/http-response";

import {
  getAdminOrder,
  completeAdminOrderInspection,
  updateAdminOrderDetails,
  updateAdminOrderPayment,
  updateAdminOrderStatus,
} from "@/lib/admin-orders";
import type { AdminInspectionItem } from "@/lib/admin-orders";
import { type PortalOrderStatus } from "@/lib/customer-portal";
import { orderStatuses } from "@/lib/order-lifecycle";
import { paymentStatuses, type PaymentStatus } from "@/lib/payments";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

async function getAdminUser() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return HttpResponse.json(
      { message: "You do not have access to orders." },
      { status: 403 },
    );
  }
  const { id } = await params;
  const order = await getAdminOrder(
    id,
    user.role === "store_manager" ? user.storeId : null,
  );
  if (!order) {
    return HttpResponse.json({ message: "Order not found." }, { status: 404 });
  }
  return HttpResponse.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return HttpResponse.json(
      { message: "You do not have access to orders." },
      { status: 403 },
    );
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "inspection") {
      const rawItems = Array.isArray(body.items) ? body.items : [];
      if (rawItems.length < 1 || rawItems.length > 50) {
        return HttpResponse.json({ message: "Add at least one inspected item." }, { status: 400 });
      }
      const items: AdminInspectionItem[] = [];
      for (const raw of rawItems) {
        if (!raw || typeof raw !== "object") return HttpResponse.json({ message: "Check the inspected items." }, { status: 400 });
        const item = raw as Record<string, unknown>;
        const garmentId = typeof item.garmentId === "string" ? item.garmentId : "";
        const serviceId = typeof item.serviceId === "string" ? item.serviceId : "";
        const quantity = Number(item.quantity);
        const rate = item.rate === undefined ? undefined : Number(item.rate);
        const discountPerItem = item.discountPerItem === undefined ? undefined : Number(item.discountPerItem);
        const text = (key: string, max: number) => typeof item[key] === "string" && (item[key] as string).trim().length <= max ? (item[key] as string).trim() : "";
        const photoUrls = Array.isArray(item.photoUrls) ? item.photoUrls.filter((value): value is string => typeof value === "string" && value.length <= 500) : [];
        if (!/^\d+$/.test(garmentId) || !/^\d+$/.test(serviceId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 1000 || (rate !== undefined && (!Number.isFinite(rate) || rate < 0 || rate > 100000)) || (discountPerItem !== undefined && (!Number.isFinite(discountPerItem) || discountPerItem < 0 || (rate !== undefined && discountPerItem > rate))) || photoUrls.length > 5 || (Array.isArray(item.photoUrls) && photoUrls.length !== item.photoUrls.length)) {
          return HttpResponse.json({ message: "Check the item quantity and price." }, { status: 400 });
        }
        items.push({ garmentId, serviceId, quantity, ...(rate === undefined ? {} : { rate }), ...(discountPerItem === undefined ? {} : { discountPerItem }), stain: text("stain", 160), damage: text("damage", 160), fabric: text("fabric", 40), instructions: text("instructions", 160), photoUrls });
      }
      const result = await completeAdminOrderInspection(
        id,
        items,
        user.role === "store_manager" ? user.storeId : null,
        user.id,
      );
      if (result.kind === "not_found") return HttpResponse.json({ message: "Order not found." }, { status: 404 });
      if (result.kind === "inspection_closed") return HttpResponse.json({ message: "This order is no longer waiting for inspection." }, { status: 409 });
      return HttpResponse.json({ order: result.order });
    }
    if (body.action === "edit") {
      const pickupAt = typeof body.pickupAt === "string" ? body.pickupAt : "";
      const paymentMethod = body.paymentMethod;
      const instructions =
        typeof body.instructions === "string" ? body.instructions.trim() : "";
      const pickupDate = new Date(pickupAt);
      if (
        Number.isNaN(pickupDate.getTime()) ||
        pickupDate.getTime() < Date.now() + 15 * 60 * 1000 ||
        pickupDate.getTime() > Date.now() + 30 * 24 * 60 * 60 * 1000
      ) {
        return HttpResponse.json(
          { message: "Choose a pickup time within the next 30 days." },
          { status: 400 },
        );
      }
      if (
        paymentMethod !== "cash" &&
        paymentMethod !== "upi" &&
        paymentMethod !== "card"
      ) {
        return HttpResponse.json(
          { message: "Choose a valid payment method." },
          { status: 400 },
        );
      }
      if (instructions.length > 120) {
        return HttpResponse.json(
          { message: "Instructions must be 120 characters or less." },
          { status: 400 },
        );
      }
      const result = await updateAdminOrderDetails(
        id,
        {
          pickupAt: pickupDate.toISOString(),
          paymentMethod,
          instructions,
        },
        user.role === "store_manager" ? user.storeId : null,
      );
      if (result.kind === "not_found") {
        return HttpResponse.json(
          { message: "Order not found." },
          { status: 404 },
        );
      }
      if (result.kind === "order_closed") {
        return HttpResponse.json(
          { message: "This order is already closed." },
          { status: 409 },
        );
      }
      if (result.kind === "payment_closed") {
        return HttpResponse.json(
          { message: "Payment is already settled. Keep the current method." },
          { status: 409 },
        );
      }
      return HttpResponse.json({ order: result.order });
    }
    if (body.action === "payment") {
      if (!paymentStatuses.includes(body.status as PaymentStatus)) {
        return HttpResponse.json(
          { message: "Select a valid payment status." },
          { status: 400 },
        );
      }
      const result = await updateAdminOrderPayment(
        id,
        body.status as PaymentStatus,
        user.role === "store_manager" ? user.storeId : null,
      );
      if (result.kind === "not_found") {
        return HttpResponse.json(
          { message: "Payment not found." },
          { status: 404 },
        );
      }
      if (result.kind === "invalid_transition") {
        return HttpResponse.json(
          { message: `Payment is already ${result.currentStatus}.` },
          { status: 409 },
        );
      }
      if (result.kind === "order_must_be_closed") {
        return HttpResponse.json(
          { message: "Cancel the order before refunding it." },
          { status: 409 },
        );
      }
      return HttpResponse.json({ payment: result.payment });
    }
    const status = body.status;
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (
      !orderStatuses.includes(status as PortalOrderStatus) ||
      note.length > 180
    ) {
      return HttpResponse.json(
        { message: "Select a valid order status." },
        { status: 400 },
      );
    }

    const result = await updateAdminOrderStatus(
      id,
      status as PortalOrderStatus,
      note,
      user.role === "store_manager" ? user.storeId : null,
    );
    if (result.kind === "not_found") {
      return HttpResponse.json(
        { message: "Order not found." },
        { status: 404 },
      );
    }
    if (result.kind === "invalid_transition") {
      return HttpResponse.json(
        {
          message: `Order cannot move from ${result.currentStatus} to ${status}.`,
        },
        { status: 409 },
      );
    }
    if (result.kind === "payment_required") {
      return HttpResponse.json(
        { message: "Confirm payment before marking this order delivered." },
        { status: 409 },
      );
    }
    if (result.kind === "rider_required") {
      return HttpResponse.json(
        {
          message:
            result.task === "pickup"
              ? "Assign a pickup rider first."
              : "Assign a delivery rider first.",
        },
        { status: 409 },
      );
    }
    return HttpResponse.json({ order: result.order });
  } catch (error) {
    console.error("Update order status failed", error);
    return HttpResponse.json(
      { message: "Unable to update order status." },
      { status: 500 },
    );
  }
}

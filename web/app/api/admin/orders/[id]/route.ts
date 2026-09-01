import { NextResponse } from "next/server";

import {
  getAdminOrder,
  updateAdminOrderStatus,
} from "@/lib/admin-orders";
import {
  type PortalOrderStatus,
} from "@/lib/customer-portal";
import { orderStatuses } from "@/lib/order-lifecycle";
import { getCurrentUser } from "@/lib/session";
import { canAccessAdminPage } from "@/lib/role-permissions";

export const runtime = "nodejs";

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
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return NextResponse.json({ message: "You do not have access to orders." }, { status: 403 });
  }
  const { id } = await params;
  const order = await getAdminOrder(id, user.role === "store_manager" ? user.storeId : null);
  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return NextResponse.json({ message: "You do not have access to orders." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = body.status;
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (
      !orderStatuses.includes(status as PortalOrderStatus) ||
      note.length > 180
    ) {
      return NextResponse.json(
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
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    if (result.kind === "invalid_transition") {
      return NextResponse.json(
        { message: `Order cannot move from ${result.currentStatus} to ${status}.` },
        { status: 409 },
      );
    }
    if (result.kind === "payment_required") {
      return NextResponse.json(
        { message: "Confirm payment before marking this order delivered." },
        { status: 409 },
      );
    }
    if (result.kind === "rider_required") {
      return NextResponse.json(
        {
          message: result.task === "pickup"
            ? "Assign a pickup rider first."
            : "Assign a delivery rider first.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ order: result.order });
  } catch (error) {
    console.error("Update order status failed", error);
    return NextResponse.json(
      { message: "Unable to update order status." },
      { status: 500 },
    );
  }
}

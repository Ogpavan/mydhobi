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

export const runtime = "nodejs";

async function getAdminUser() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) {
    return NextResponse.json({ message: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
    );
    if (result.kind === "not_found") {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    if (result.kind === "invalid_transition") {
      return NextResponse.json(
        { message: `Order is already ${result.currentStatus}.` },
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

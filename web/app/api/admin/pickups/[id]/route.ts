import { NextResponse } from "next/server";

import {
  pickupStatuses,
  updatePickupTask,
  type PickupStatus,
} from "@/lib/pickups";
import { getCurrentUser } from "@/lib/session";
import { canAccessAdminPage } from "@/lib/role-permissions";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "pickups"))) {
    return NextResponse.json({ message: "You do not have access to pickups." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const riderId =
      typeof body.riderId === "string" && /^\d+$/.test(body.riderId)
        ? body.riderId
        : undefined;
    const status = pickupStatuses.includes(body.status as PickupStatus)
      ? (body.status as PickupStatus)
      : undefined;
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;
    let scheduledAt: string | undefined;
    if (typeof body.scheduledAt === "string") {
      const date = new Date(body.scheduledAt);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { message: "Select a valid pickup time." },
          { status: 400 },
        );
      }
      scheduledAt = date.toISOString();
    }
    if (!riderId && !status && !scheduledAt && notes === undefined) {
      return NextResponse.json(
        { message: "Choose a pickup update." },
        { status: 400 },
      );
    }
    if (notes && notes.length > 180) {
      return NextResponse.json(
        { message: "Note must be 180 characters or less." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const result = await updatePickupTask(id, {
      ...(riderId ? { riderId } : {}),
      ...(status ? { status } : {}),
      ...(scheduledAt ? { scheduledAt } : {}),
      ...(notes !== undefined ? { notes } : {}),
    }, user.role === "store_manager" ? user.storeId : null);
    if (result.kind === "not_found") {
      return NextResponse.json({ message: "Pickup not found." }, { status: 404 });
    }
    if (result.kind === "invalid_transition") {
      return NextResponse.json(
        { message: `Pickup is already ${result.currentStatus}.` },
        { status: 409 },
      );
    }
    if (result.kind === "rider_required") {
      return NextResponse.json(
        { message: "Assign a rider first." },
        { status: 400 },
      );
    }
    if (result.kind === "invalid_rider") {
      return NextResponse.json(
        { message: "Select an active rider from this store." },
        { status: 400 },
      );
    }
    if (result.kind === "order_closed") {
      return NextResponse.json(
        { message: "This order is already closed." },
        { status: 409 },
      );
    }
    if (result.kind === "payment_required") {
      return NextResponse.json(
        { message: "Confirm payment before closing this order." },
        { status: 409 },
      );
    }
    return NextResponse.json({ pickup: result.pickup });
  } catch (error) {
    console.error("Update pickup failed", error);
    return NextResponse.json(
      { message: "Unable to update pickup." },
      { status: 500 },
    );
  }
}

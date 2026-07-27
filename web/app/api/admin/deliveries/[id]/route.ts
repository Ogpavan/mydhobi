import { NextResponse } from "next/server";

import {
  deliveryStatuses,
  updateDeliveryTask,
  type DeliveryStatus,
} from "@/lib/deliveries";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const riderId =
      typeof body.riderId === "string" && /^\d+$/.test(body.riderId)
        ? body.riderId
        : undefined;
    const status = deliveryStatuses.includes(body.status as DeliveryStatus)
      ? (body.status as DeliveryStatus)
      : undefined;
    const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;
    let scheduledAt: string | undefined;
    if (typeof body.scheduledAt === "string") {
      const date = new Date(body.scheduledAt);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json(
          { message: "Select a valid delivery time." },
          { status: 400 },
        );
      }
      scheduledAt = date.toISOString();
    }
    if (!riderId && !status && !scheduledAt && notes === undefined) {
      return NextResponse.json(
        { message: "Choose a delivery update." },
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
    const result = await updateDeliveryTask(id, {
      ...(riderId ? { riderId } : {}),
      ...(status ? { status } : {}),
      ...(scheduledAt ? { scheduledAt } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });
    if (result.kind === "not_found") {
      return NextResponse.json(
        { message: "Delivery not found." },
        { status: 404 },
      );
    }
    if (result.kind === "invalid_transition") {
      return NextResponse.json(
        { message: `Delivery is already ${result.currentStatus}.` },
        { status: 409 },
      );
    }
    if (result.kind === "rider_required") {
      return NextResponse.json(
        { message: "Assign a rider first." },
        { status: 400 },
      );
    }
    return NextResponse.json({ delivery: result.delivery });
  } catch (error) {
    console.error("Update delivery failed", error);
    return NextResponse.json(
      { message: "Unable to update delivery." },
      { status: 500 },
    );
  }
}

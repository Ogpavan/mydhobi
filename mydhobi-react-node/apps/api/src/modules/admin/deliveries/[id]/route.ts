import { HttpResponse } from "@/server/http-response";

import {
  deliveryStatuses,
  updateDeliveryTask,
  type DeliveryStatus,
} from "@/lib/deliveries";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "deliveries"))) {
    return HttpResponse.json(
      { message: "You do not have access to deliveries." },
      { status: 403 },
    );
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
    const notes =
      typeof body.notes === "string" ? body.notes.trim() : undefined;
    let scheduledAt: string | undefined;
    if (typeof body.scheduledAt === "string") {
      const date = new Date(body.scheduledAt);
      if (Number.isNaN(date.getTime())) {
        return HttpResponse.json(
          { message: "Select a valid delivery time." },
          { status: 400 },
        );
      }
      scheduledAt = date.toISOString();
    }
    if (!riderId && !status && !scheduledAt && notes === undefined) {
      return HttpResponse.json(
        { message: "Choose a delivery update." },
        { status: 400 },
      );
    }
    if (notes && notes.length > 180) {
      return HttpResponse.json(
        { message: "Note must be 180 characters or less." },
        { status: 400 },
      );
    }

    const { id } = await params;
    const result = await updateDeliveryTask(
      id,
      {
        ...(riderId ? { riderId } : {}),
        ...(status ? { status } : {}),
        ...(scheduledAt ? { scheduledAt } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      user.role === "store_manager" ? user.storeId : null,
    );
    if (result.kind === "not_found") {
      return HttpResponse.json(
        { message: "Delivery not found." },
        { status: 404 },
      );
    }
    if (result.kind === "invalid_transition") {
      return HttpResponse.json(
        { message: `Delivery is already ${result.currentStatus}.` },
        { status: 409 },
      );
    }
    if (result.kind === "rider_required") {
      return HttpResponse.json(
        { message: "Assign a rider first." },
        { status: 400 },
      );
    }
    if (result.kind === "invalid_rider") {
      return HttpResponse.json(
        { message: "Select an active rider from this store." },
        { status: 400 },
      );
    }
    if (result.kind === "order_closed") {
      return HttpResponse.json(
        { message: "This order is already closed." },
        { status: 409 },
      );
    }
    if (result.kind === "payment_required") {
      return HttpResponse.json(
        { message: "Confirm payment before marking this order delivered." },
        { status: 409 },
      );
    }
    return HttpResponse.json({ delivery: result.delivery });
  } catch (error) {
    console.error("Update delivery failed", error);
    return HttpResponse.json(
      { message: "Unable to update delivery." },
      { status: 500 },
    );
  }
}

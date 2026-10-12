import { HttpResponse } from "@/server/http-response";

import {
  paymentStatuses,
  updatePaymentStatus,
  type PaymentStatus,
} from "@/lib/payments";
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
  if (!(await canAccessAdminPage(user, "payments"))) {
    return HttpResponse.json(
      { message: "You do not have access to payments." },
      { status: 403 },
    );
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!paymentStatuses.includes(body.status as PaymentStatus)) {
      return HttpResponse.json(
        { message: "Select a valid payment status." },
        { status: 400 },
      );
    }
    const { id } = await params;
    const result = await updatePaymentStatus(
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
  } catch (error) {
    console.error("Update payment failed", error);
    return HttpResponse.json(
      { message: "Unable to update payment." },
      { status: 500 },
    );
  }
}

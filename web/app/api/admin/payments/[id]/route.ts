import { NextResponse } from "next/server";

import {
  paymentStatuses,
  updatePaymentStatus,
  type PaymentStatus,
} from "@/lib/payments";
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
    if (!paymentStatuses.includes(body.status as PaymentStatus)) {
      return NextResponse.json(
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
      return NextResponse.json(
        { message: "Payment not found." },
        { status: 404 },
      );
    }
    if (result.kind === "invalid_transition") {
      return NextResponse.json(
        { message: `Payment is already ${result.currentStatus}.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ payment: result.payment });
  } catch (error) {
    console.error("Update payment failed", error);
    return NextResponse.json(
      { message: "Unable to update payment." },
      { status: 500 },
    );
  }
}

import { HttpResponse } from "@/server/http-response";

import { confirmPortalOrder, getPortalOrder } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const order = await getPortalOrder(user.id, id);
  if (!order)
    return HttpResponse.json({ message: "Order not found." }, { status: 404 });
  return HttpResponse.json({ order });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as Record<string, unknown>;
  if (body.action !== "confirm" || (body.paymentMethod !== "cash" && body.paymentMethod !== "wallet")) {
    return HttpResponse.json({ message: "Choose how you will pay." }, { status: 400 });
  }
  const result = await confirmPortalOrder(user.id, (await params).id, body.paymentMethod);
  if (result.kind === "not_found") return HttpResponse.json({ message: "Order not found." }, { status: 404 });
  if (result.kind === "not_ready") return HttpResponse.json({ message: "This order is not waiting for confirmation." }, { status: 409 });
  if (result.kind === "insufficient_wallet") return HttpResponse.json({ message: "Not enough wallet balance." }, { status: 400 });
  return HttpResponse.json({ order: result.order });
}

import { HttpResponse } from "@/server/http-response";
import {
  getOrderChargeById,
  parseOrderChargeInput,
  updateOrderCharge,
} from "@/lib/order-charges";
import { getCurrentUser } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

async function adminUser() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await adminUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 403 });
  try {
    const id = (await params).id;
    const existing = await getOrderChargeById(id);
    if (!existing)
      return HttpResponse.json(
        { message: "Charge not found." },
        { status: 404 },
      );
    const input = parseOrderChargeInput(
      (await request.json()) as Record<string, unknown>,
      existing.code,
    );
    if (!input)
      return HttpResponse.json(
        { message: "Check the charge details." },
        { status: 400 },
      );
    return HttpResponse.json({ charge: await updateOrderCharge(id, input) });
  } catch (error) {
    console.error("Update order charge failed", error);
    return HttpResponse.json(
      { message: "Unable to update charge right now." },
      { status: 500 },
    );
  }
}

import { HttpResponse } from "@/server/http-response";

import { resolveCustomerStoreId } from "@/lib/customer-portal";
import { listOffers, validateOffer } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const storeId = await resolveCustomerStoreId(user.id);
  return HttpResponse.json({ offers: await listOffers(true, storeId) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const subtotal = Number(body.subtotal);
  if (!code || !Number.isFinite(subtotal) || subtotal < 0)
    return HttpResponse.json(
      { message: "Enter a coupon code." },
      { status: 400 },
    );
  const storeId = await resolveCustomerStoreId(user.id);
  const result = await validateOffer(code, subtotal, storeId);
  return result.valid
    ? HttpResponse.json(result)
    : HttpResponse.json({ message: result.message }, { status: 400 });
}

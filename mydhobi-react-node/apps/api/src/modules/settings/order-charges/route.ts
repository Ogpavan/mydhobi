import { HttpResponse } from "@/server/http-response";
import {
  createOrderCharge,
  listOrderCharges,
  parseOrderChargeInput,
} from "@/lib/order-charges";
import { getCurrentUser } from "@/lib/session";

async function adminUser() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  if (!(await adminUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 403 });
  return HttpResponse.json({ charges: await listOrderCharges(true) });
}

export async function POST(request: Request) {
  if (!(await adminUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 403 });
  try {
    const input = parseOrderChargeInput(
      (await request.json()) as Record<string, unknown>,
    );
    if (!input)
      return HttpResponse.json(
        { message: "Check the charge details." },
        { status: 400 },
      );
    return HttpResponse.json(
      { charge: await createOrderCharge(input) },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return HttpResponse.json(
        { message: "A charge with this code already exists." },
        { status: 409 },
      );
    }
    console.error("Create order charge failed", error);
    return HttpResponse.json(
      { message: "Unable to create charge right now." },
      { status: 500 },
    );
  }
}

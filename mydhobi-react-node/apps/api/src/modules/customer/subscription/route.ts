import { HttpResponse } from "@/server/http-response";

import {
  activateCustomerSubscription,
  getCustomerSubscription,
} from "@/lib/subscriptions";
import { getCurrentUser } from "@/lib/session";

async function customerUser() {
  const user = await getCurrentUser();
  return user?.role === "customer" ? user : null;
}

export async function GET() {
  const user = await customerUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  return HttpResponse.json(await getCustomerSubscription(user.id));
}

export async function POST(request: Request) {
  const user = await customerUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const planCode = typeof body.planCode === "string" ? body.planCode : "";
    const subscription = await activateCustomerSubscription(user.id, planCode);
    return HttpResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "SUBSCRIPTION_PLAN_NOT_FOUND"
    )
      return HttpResponse.json(
        { message: "Choose a valid subscription plan." },
        { status: 400 },
      );
    if (error instanceof Error && error.message === "ACTIVE_SUBSCRIPTION")
      return HttpResponse.json(
        { message: "You already have an active subscription." },
        { status: 409 },
      );
    if (
      error instanceof Error &&
      error.message === "INSUFFICIENT_WALLET_BALANCE"
    )
      return HttpResponse.json(
        { message: "Add money to your wallet before subscribing." },
        { status: 400 },
      );
    console.error("Activate customer subscription failed", error);
    return HttpResponse.json(
      { message: "Unable to activate subscription." },
      { status: 500 },
    );
  }
}

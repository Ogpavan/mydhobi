import { HttpResponse } from "@/server/http-response";

import {
  createDiscountGroup,
  listDiscountGroups,
  validateDiscountGroupPayload,
  type DiscountGroupPayload,
} from "@/lib/discount-groups";
import { getCurrentUser } from "@/lib/session";

function adminOnly(user: Awaited<ReturnType<typeof getCurrentUser>>) {
  return user?.role === "admin";
}

function payloadFromBody(body: Record<string, unknown>): DiscountGroupPayload {
  return {
    name: typeof body.name === "string" ? body.name : "",
    description: typeof body.description === "string" ? body.description : "",
    isActive: body.isActive !== false,
    rules: Array.isArray(body.rules)
      ? body.rules.map((rule) => {
          const value =
            typeof rule === "object" && rule !== null
              ? (rule as Record<string, unknown>)
              : {};
          return {
            serviceId: Number(value.serviceId),
            discountType:
              value.discountType as DiscountGroupPayload["rules"][number]["discountType"],
            discountValue: Number(value.discountValue),
          };
        })
      : [],
  };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!adminOnly(user))
    return HttpResponse.json(
      { message: "Admin access is required." },
      { status: 403 },
    );
  const url = new URL(request.url);
  return HttpResponse.json({
    groups: await listDiscountGroups(
      url.searchParams.get("status") !== "active",
      url.searchParams.get("search") ?? "",
    ),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (!adminOnly(user))
    return HttpResponse.json(
      { message: "Admin access is required." },
      { status: 403 },
    );
  try {
    const payload = payloadFromBody(
      (await request.json()) as Record<string, unknown>,
    );
    const error = validateDiscountGroupPayload(payload);
    if (error) return HttpResponse.json({ message: error }, { status: 400 });
    return HttpResponse.json(
      { group: await createDiscountGroup(payload) },
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
        { message: "A discount group with this name already exists." },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "SERVICE_NOT_FOUND")
      return HttpResponse.json(
        { message: "One or more services were not found." },
        { status: 400 },
      );
    return HttpResponse.json(
      { message: "Unable to create discount group." },
      { status: 500 },
    );
  }
}

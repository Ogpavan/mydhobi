import { HttpResponse } from "@/server/http-response";

import {
  deleteDiscountGroup,
  getDiscountGroup,
  updateDiscountGroup,
  validateDiscountGroupPayload,
  type DiscountGroupPayload,
} from "@/lib/discount-groups";
import { getCurrentUser } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

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

async function adminUser() {
  const user = await getCurrentUser();
  if (!user)
    return {
      user: null,
      response: HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  if (user.role !== "admin")
    return {
      user: null,
      response: HttpResponse.json(
        { message: "Admin access is required." },
        { status: 403 },
      ),
    };
  return { user, response: null };
}

export async function GET(_request: Request, { params }: Context) {
  const access = await adminUser();
  if (access.response) return access.response;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1)
    return HttpResponse.json(
      { message: "Discount group not found." },
      { status: 404 },
    );
  const group = await getDiscountGroup(id);
  return group
    ? HttpResponse.json({ group })
    : HttpResponse.json(
        { message: "Discount group not found." },
        { status: 404 },
      );
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await adminUser();
  if (access.response) return access.response;
  try {
    const id = Number((await params).id);
    const payload = payloadFromBody(
      (await request.json()) as Record<string, unknown>,
    );
    const error = validateDiscountGroupPayload(payload);
    if (!Number.isInteger(id) || id < 1 || error)
      return HttpResponse.json(
        { message: error ?? "Discount group not found." },
        { status: 400 },
      );
    const group = await updateDiscountGroup(id, payload);
    return group
      ? HttpResponse.json({ group })
      : HttpResponse.json(
          { message: "Discount group not found." },
          { status: 404 },
        );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    )
      return HttpResponse.json(
        { message: "A discount group with this name already exists." },
        { status: 409 },
      );
    if (error instanceof Error && error.message === "SERVICE_NOT_FOUND")
      return HttpResponse.json(
        { message: "One or more services were not found." },
        { status: 400 },
      );
    return HttpResponse.json(
      { message: "Unable to update discount group." },
      { status: 500 },
    );
  }
}

export const PUT = PATCH;

export async function DELETE(_request: Request, { params }: Context) {
  const access = await adminUser();
  if (access.response) return access.response;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1)
    return HttpResponse.json(
      { message: "Discount group not found." },
      { status: 404 },
    );
  return (await deleteDiscountGroup(id))
    ? HttpResponse.json({ ok: true })
    : HttpResponse.json(
        { message: "Discount group not found." },
        { status: 404 },
      );
}

import { HttpResponse } from "@/server/http-response";
import bcrypt from "bcryptjs";

import {
  createCustomer,
  listCustomers,
  normalizeCustomerPayload,
  validateCustomerPayload,
} from "@/lib/customers";
import { getCurrentUser } from "@/lib/session";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    return HttpResponse.json({
      customers: await listCustomers(
        user.role === "store_manager" ? user.storeId : null,
      ),
    });
  } catch (error) {
    console.error("List customers failed", error);
    return HttpResponse.json(
      { message: "Unable to load customers right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role === "customer" ||
    (user.role === "store_manager" && !user.storeId)
  ) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeCustomerPayload(body);
    const validationError = validateCustomerPayload(payload);
    if (validationError) {
      return HttpResponse.json({ message: validationError }, { status: 400 });
    }
    const password = typeof body.password === "string" ? body.password : "";
    if (password && (password.length < 8 || password.length > 72)) {
      return HttpResponse.json(
        { message: "Password must be 8 to 72 characters." },
        { status: 400 },
      );
    }
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    return HttpResponse.json(
      {
        customer: await createCustomer(
          payload,
          passwordHash,
          user.role === "store_manager" ? user.storeId : null,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return HttpResponse.json(
        {
          message: "This mobile number is already used by a customer or login.",
        },
        { status: 409 },
      );
    }
    console.error("Create customer failed", error);
    return HttpResponse.json(
      { message: "Unable to add customer right now." },
      { status: 500 },
    );
  }
}

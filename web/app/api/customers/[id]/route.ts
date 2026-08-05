import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {
  deleteCustomer,
  getCustomerById,
  normalizeCustomerPayload,
  updateCustomer,
  updateCustomerStatus,
  validateCustomerPayload,
} from "@/lib/customers";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    error.code === "23505";
}

export async function GET(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const customer = await getCustomerById(id, user.role === "store_manager" ? user.storeId : null);
  return customer
    ? NextResponse.json({ customer })
    : NextResponse.json({ message: "Customer not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer" || (user.role === "store_manager" && !user.storeId)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;

    if (
      Object.keys(body).length === 1 &&
      (body.status === "active" || body.status === "inactive")
    ) {
      const customer = await updateCustomerStatus(id, body.status, user.role === "store_manager" ? user.storeId : null);
      return customer
        ? NextResponse.json({ customer })
        : NextResponse.json({ message: "Customer not found." }, { status: 404 });
    }

    const payload = normalizeCustomerPayload(body);
    const validationError = validateCustomerPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }
    const password = typeof body.password === "string" ? body.password : "";
    if (password && (password.length < 8 || password.length > 72)) {
      return NextResponse.json(
        { message: "Password must be 8 to 72 characters." },
        { status: 400 },
      );
    }
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;

    const customer = await updateCustomer(id, payload, passwordHash, user.role === "store_manager" ? user.storeId : null);
    return customer
      ? NextResponse.json({ customer })
      : NextResponse.json({ message: "Customer not found." }, { status: 404 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "This mobile number is already used by a customer or login." },
        { status: 409 },
      );
    }
    console.error("Update customer failed", error);
    return NextResponse.json(
      { message: "Unable to update customer right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer" || (user.role === "store_manager" && !user.storeId)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    return await deleteCustomer(id, user.role === "store_manager" ? user.storeId : null)
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ message: "Customer not found." }, { status: 404 });
  } catch (error) {
    console.error("Delete customer failed", error);
    return NextResponse.json(
      { message: "Unable to delete customer right now." },
      { status: 500 },
    );
  }
}

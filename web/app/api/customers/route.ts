import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {
  createCustomer,
  listCustomers,
  normalizeCustomerPayload,
  validateCustomerPayload,
} from "@/lib/customers";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    error.code === "23505";
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json({ customers: await listCustomers() });
  } catch (error) {
    console.error("List customers failed", error);
    return NextResponse.json(
      { message: "Unable to load customers right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
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

    return NextResponse.json(
      { customer: await createCustomer(payload, passwordHash) },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "This mobile number is already used by a customer or login." },
        { status: 409 },
      );
    }
    console.error("Create customer failed", error);
    return NextResponse.json(
      { message: "Unable to add customer right now." },
      { status: 500 },
    );
  }
}

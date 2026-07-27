import { NextResponse } from "next/server";

import {
  adjustAdminCustomerWallet,
  getAdminCustomerWallet,
} from "@/lib/admin-customer-wallet";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Customer not found." }, { status: 404 });
  }

  try {
    const wallet = await getAdminCustomerWallet(id);
    if (!wallet) {
      return NextResponse.json({ message: "Customer not found." }, { status: 404 });
    }
    return NextResponse.json(
      { wallet },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Load customer wallet failed", error);
    return NextResponse.json(
      { message: "Unable to load wallet right now." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Customer not found." }, { status: 404 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action === "deduct" ? "deduct" : body.action === "add" ? "add" : null;
    const amount = Number(body.amount);
    const reason = typeof body.reason === "string"
      ? body.reason.trim().replace(/\s+/g, " ")
      : "";

    if (!action) {
      return NextResponse.json({ message: "Choose Add or Deduct." }, { status: 400 });
    }
    if (
      !Number.isFinite(amount) ||
      amount < 1 ||
      amount > 50000 ||
      Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001
    ) {
      return NextResponse.json(
        { message: "Enter an amount from ₹1 to ₹50,000." },
        { status: 400 },
      );
    }
    if (reason.length < 3 || reason.length > 200) {
      return NextResponse.json(
        { message: "Enter a short reason." },
        { status: 400 },
      );
    }

    const result = await adjustAdminCustomerWallet({
      customerId: id,
      adminId: admin.id,
      action,
      amount,
      reason,
    });
    if (result.status === "not_found") {
      return NextResponse.json({ message: "Customer not found." }, { status: 404 });
    }
    if (result.status === "no_login") {
      return NextResponse.json(
        { message: "This customer does not have login access." },
        { status: 409 },
      );
    }
    if (result.status === "insufficient_balance") {
      return NextResponse.json(
        { message: "Wallet balance is too low.", balance: result.balance },
        { status: 409 },
      );
    }

    return NextResponse.json({ wallet: result.wallet });
  } catch (error) {
    console.error("Adjust customer wallet failed", error);
    return NextResponse.json(
      { message: "Unable to update wallet right now." },
      { status: 500 },
    );
  }
}

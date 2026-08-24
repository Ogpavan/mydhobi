import { NextResponse } from "next/server";

import { createRateCardGroup, listRateCardGroups } from "@/lib/rate-card-groups";
import { getCurrentUser } from "@/lib/session";

async function authorized() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ groups: await listRateCardGroups(true) });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const suppliedCode = typeof body.tariffCode === "string" ? body.tariffCode.trim() : "";
    const baseCode = name.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "PRICE-LIST";
    const tariffCode = suppliedCode || `${baseCode}-${Date.now().toString(36).toUpperCase()}`;
    if (!name || name.length > 100 || tariffCode.length > 50) return NextResponse.json({ message: "Enter a price list name." }, { status: 400 });
    const description = typeof body.description === "string" ? body.description.slice(0, 1000) : "";
    const copyType = body.copyType === "group" || body.copyType === "store" ? body.copyType : null;
    const copyId = copyType === "group" ? Number(body.copyId) : typeof body.copyId === "string" ? body.copyId.trim() : "";
    if (copyType === "group" && (!Number.isInteger(copyId) || Number(copyId) < 1)) return NextResponse.json({ message: "Choose a price list to copy." }, { status: 400 });
    if (copyType === "store" && !copyId) return NextResponse.json({ message: "Choose a store to copy." }, { status: 400 });
    const copyFrom = copyType === "group"
      ? { type: "group" as const, id: Number(copyId) }
      : copyType === "store"
        ? { type: "store" as const, id: String(copyId) }
        : undefined;
    return NextResponse.json({ group: await createRateCardGroup({ name, tariffCode, description, isActive: body.isActive !== false, copyFrom }) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "A price list with this name or code already exists." }, { status: 409 });
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to create price list." }, { status: 400 });
  }
}

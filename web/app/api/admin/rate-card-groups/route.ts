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
    const tariffCode = typeof body.tariffCode === "string" ? body.tariffCode.trim() : "";
    if (!name || name.length > 100 || !tariffCode || tariffCode.length > 50) return NextResponse.json({ message: "Enter a rate group name and tariff code." }, { status: 400 });
    const description = typeof body.description === "string" ? body.description.slice(0, 1000) : "";
    return NextResponse.json({ group: await createRateCardGroup({ name, tariffCode, description, isActive: body.isActive !== false }) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "A rate group with this name already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to create rate group." }, { status: 500 });
  }
}

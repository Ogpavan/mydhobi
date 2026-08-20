import { NextResponse } from "next/server";

import { deleteRateCardGroup, updateRateCardGroup } from "@/lib/rate-card-groups";
import { getCurrentUser } from "@/lib/session";

async function authorized() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ message: "Invalid rate group." }, { status: 400 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const group = await updateRateCardGroup(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      tariffCode: typeof body.tariffCode === "string" ? body.tariffCode : undefined,
      description: typeof body.description === "string" ? body.description.slice(0, 1000) : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    return group ? NextResponse.json({ group }) : NextResponse.json({ message: "Rate group not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "A rate group with this name already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update rate group." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ message: "Invalid rate group." }, { status: 400 });
  try {
    const deleted = await deleteRateCardGroup(id);
    return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "Rate group not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to delete rate group." }, { status: 409 });
  }
}

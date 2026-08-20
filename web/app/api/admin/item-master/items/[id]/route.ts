import { NextResponse } from "next/server";

import { deleteItem, getItem, updateItem } from "@/lib/item-master";
import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";
import { getCurrentUser } from "@/lib/session";

async function authorized() { const user = await getCurrentUser(); return user && user.role !== "customer" ? user : null; }

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const item = await getItem(Number((await context.params).id));
  return item ? NextResponse.json({ item }) : NextResponse.json({ message: "Item not found." }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const defaultPricingUnit = body.defaultPricingUnit as PricingUnit | undefined;
    if (defaultPricingUnit !== undefined && !PRICING_UNITS.includes(defaultPricingUnit)) return NextResponse.json({ message: "Invalid pricing unit." }, { status: 400 });
    const item = await updateItem(Number((await context.params).id), {
      name: typeof body.name === "string" ? body.name : undefined, categoryId: body.categoryId === undefined ? undefined : Number(body.categoryId), shortCode: typeof body.shortCode === "string" ? body.shortCode : undefined,
      description: typeof body.description === "string" ? body.description.slice(0, 1000) : undefined, imagePath: typeof body.imagePath === "string" ? body.imagePath.slice(0, 250) : undefined, defaultPricingUnit,
      sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder), isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    return item ? NextResponse.json({ item }) : NextResponse.json({ message: "Item not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "An item with this name or short code already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update item." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try { const deleted = await deleteItem(Number((await context.params).id)); return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "Item not found." }, { status: 404 }); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to delete item." }, { status: 409 }); }
}

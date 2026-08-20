import { NextResponse } from "next/server";

import { createItem, listItems } from "@/lib/item-master";
import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const categoryId = Number(url.searchParams.get("categoryId"));
  return NextResponse.json({ items: await listItems({ includeInactive: true, categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined, search: url.searchParams.get("search") ?? "" }) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const shortCode = typeof body.shortCode === "string" ? body.shortCode.trim() : "";
    const categoryId = Number(body.categoryId);
    const pricingUnit = body.defaultPricingUnit as PricingUnit;
    if (!name || name.length > 150 || !shortCode || shortCode.length > 30 || !Number.isInteger(categoryId) || categoryId < 1 || !PRICING_UNITS.includes(pricingUnit)) return NextResponse.json({ message: "Enter item name, category, short code, and pricing unit." }, { status: 400 });
    return NextResponse.json({ item: await createItem({ name, categoryId, shortCode, description: typeof body.description === "string" ? body.description.slice(0, 1000) : "", imagePath: typeof body.imagePath === "string" ? body.imagePath.slice(0, 250) : "", defaultPricingUnit: pricingUnit, sortOrder: Number(body.sortOrder ?? 0), isActive: body.isActive !== false }) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "An item with this name or short code already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to create item." }, { status: 500 });
  }
}

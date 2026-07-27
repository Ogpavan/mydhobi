import { NextResponse } from "next/server";

import {
  createSetupInventoryCategory,
  listSetupInventoryCategories,
  normalizeInventorySetupName,
  validateInventorySetupName,
} from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ categories: await listSetupInventoryCategories() });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { name?: unknown; unitTypeId?: unknown };
    const name = normalizeInventorySetupName(body.name);
    const unitTypeId = typeof body.unitTypeId === "string" ? body.unitTypeId : "";
    const error = validateInventorySetupName(name, "Category");
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    if (!/^\d+$/.test(unitTypeId)) return NextResponse.json({ message: "Select a unit type." }, { status: 400 });
    const category = await createSetupInventoryCategory(name, unitTypeId);
    return category
      ? NextResponse.json({ category }, { status: 201 })
      : NextResponse.json({ message: "Unit type not found." }, { status: 400 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "This category already exists." }, { status: 409 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
      return NextResponse.json({ message: "Select a valid unit type." }, { status: 400 });
    }
    console.error("Create inventory category failed", error);
    return NextResponse.json({ message: "Unable to add category right now." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import {
  deleteSetupInventoryCategory,
  normalizeInventorySetupName,
  updateSetupInventoryCategory,
  updateSetupInventoryCategoryStatus,
  validateInventorySetupName,
} from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json() as { name?: unknown; unitTypeId?: unknown; isActive?: unknown };
    if (typeof body.isActive === "boolean") {
      const category = await updateSetupInventoryCategoryStatus(id, body.isActive);
      return category
        ? NextResponse.json({ category })
        : NextResponse.json({ message: "Category not found." }, { status: 404 });
    }
    const name = normalizeInventorySetupName(body.name);
    const unitTypeId = typeof body.unitTypeId === "string" ? body.unitTypeId : "";
    const error = validateInventorySetupName(name, "Category");
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    if (!/^\d+$/.test(unitTypeId)) return NextResponse.json({ message: "Select a unit type." }, { status: 400 });
    const category = await updateSetupInventoryCategory(id, name, unitTypeId);
    return category
      ? NextResponse.json({ category })
      : NextResponse.json({ message: "Category not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "This category already exists." }, { status: 409 });
    }
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23503") {
      return NextResponse.json({ message: "Select a valid unit type." }, { status: 400 });
    }
    return NextResponse.json({ message: "Unable to update category right now." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return await deleteSetupInventoryCategory((await params).id)
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ message: "Category not found." }, { status: 404 });
}

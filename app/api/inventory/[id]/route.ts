import { NextResponse } from "next/server";

import {
  deleteInventoryItem,
  getInventoryItemById,
  normalizeInventoryPayload,
  updateInventoryItem,
  updateInventoryItemStatus,
  validateInventoryPayload,
} from "@/lib/inventory";
import { isActiveInventorySelection } from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const item = await getInventoryItemById((await params).id);
  return item
    ? NextResponse.json({ item })
    : NextResponse.json({ message: "Item not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    if (Object.keys(body).length === 1 &&
        (body.status === "active" || body.status === "inactive")) {
      const item = await updateInventoryItemStatus(id, body.status);
      return item
        ? NextResponse.json({ item })
        : NextResponse.json({ message: "Item not found." }, { status: 404 });
    }
    const payload = normalizeInventoryPayload(body);
    const error = validateInventoryPayload(payload);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    if (!(await isActiveInventorySelection(payload.category, payload.unitType))) {
      return NextResponse.json(
        { message: "Select an active category and its linked unit type." },
        { status: 400 },
      );
    }
    const item = await updateInventoryItem(id, payload);
    return item
      ? NextResponse.json({ item })
      : NextResponse.json({ message: "Item not found." }, { status: 404 });
  } catch (error) {
    console.error("Update inventory item failed", error);
    return NextResponse.json({ message: "Unable to update item right now." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    return await deleteInventoryItem((await params).id)
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ message: "Item not found." }, { status: 404 });
  } catch (error) {
    console.error("Delete inventory item failed", error);
    return NextResponse.json({ message: "Unable to delete item right now." }, { status: 500 });
  }
}

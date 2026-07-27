import { NextResponse } from "next/server";

import {
  createInventoryItem,
  listInventoryItems,
  normalizeInventoryPayload,
  validateInventoryPayload,
} from "@/lib/inventory";
import { isActiveInventorySelection } from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ items: await listInventoryItems() });
  } catch (error) {
    console.error("List inventory failed", error);
    return NextResponse.json(
      { message: "Unable to load inventory right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = normalizeInventoryPayload(
      await request.json() as Record<string, unknown>,
    );
    const validationError = validateInventoryPayload(payload);
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }
    if (!(await isActiveInventorySelection(payload.category, payload.unitType))) {
      return NextResponse.json(
        { message: "Select an active category and its linked unit type." },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { item: await createInventoryItem(payload) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create inventory item failed", error);
    return NextResponse.json(
      { message: "Unable to add item right now." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";

import {
  createSetupInventoryUnit,
  listSetupInventoryUnits,
  normalizeInventorySetupName,
  validateInventorySetupName,
} from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ units: await listSetupInventoryUnits() });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { name?: unknown };
    const name = normalizeInventorySetupName(body.name);
    const error = validateInventorySetupName(name, "Unit type");
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    return NextResponse.json({ unit: await createSetupInventoryUnit(name) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "This unit type already exists." }, { status: 409 });
    }
    console.error("Create inventory unit failed", error);
    return NextResponse.json({ message: "Unable to add unit type right now." }, { status: 500 });
  }
}

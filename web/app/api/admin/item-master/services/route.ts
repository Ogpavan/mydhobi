import { NextResponse } from "next/server";

import { createItemService, listServices } from "@/lib/item-master";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ services: await listServices(true) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 100) return NextResponse.json({ message: "Enter a valid service name." }, { status: 400 });
    return NextResponse.json({ service: await createItemService({ name, description: typeof body.description === "string" ? body.description.slice(0, 1000) : "", imagePath: typeof body.imagePath === "string" ? body.imagePath.slice(0, 250) : "", sortOrder: Number(body.sortOrder ?? 0), isActive: body.isActive !== false }) }, { status: 201 });
  } catch (error) { if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "A service with this name already exists." }, { status: 409 }); return NextResponse.json({ message: "Unable to create service." }, { status: 500 }); }
}

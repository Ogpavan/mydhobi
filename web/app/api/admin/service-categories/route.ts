import { NextResponse } from "next/server";

import { createServiceCategory, GARMENT_AUDIENCES, listServiceCategories, type GarmentAudience } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ categories: await listServiceCategories(true) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const imagePath = typeof body.imagePath === "string" ? body.imagePath.trim() : "";
    const audience = GARMENT_AUDIENCES.includes(body.audience as GarmentAudience)
      ? body.audience as GarmentAudience
      : "other";
    const displayOrder = Number(body.displayOrder);
    if (!name || name.length > 80 || !Number.isInteger(displayOrder) || displayOrder < 0) {
      return NextResponse.json({ message: "Enter a valid category name and order." }, { status: 400 });
    }
    return NextResponse.json({ category: await createServiceCategory({ name, imagePath: imagePath.slice(0, 250), audience, displayOrder }) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A category with this name already exists." }, { status: 409 });
    }
    console.error("Create service category failed", error);
    return NextResponse.json({ message: "Unable to create category." }, { status: 500 });
  }
}

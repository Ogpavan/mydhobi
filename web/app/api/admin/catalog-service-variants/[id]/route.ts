import { NextResponse } from "next/server";

import { CATALOG_UNITS, updateCatalogServiceVariant } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const { id } = await params;
    const variant = await updateCatalogServiceVariant(id, {
      ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim().slice(0, 100) } : {}),
      ...(typeof body.unit === "string" && CATALOG_UNITS.includes(body.unit as typeof CATALOG_UNITS[number]) ? { unit: body.unit as typeof CATALOG_UNITS[number] } : {}),
      ...(Number.isFinite(Number(body.regularPrice)) && Number(body.regularPrice) >= 0 ? { regularPrice: Number(body.regularPrice) } : {}),
      ...(body.expressPrice === null ? { expressPrice: null } : Number.isFinite(Number(body.expressPrice)) && Number(body.expressPrice) >= 0 ? { expressPrice: Number(body.expressPrice) } : {}),
      ...(Number.isInteger(Number(body.displayOrder)) && Number(body.displayOrder) >= 0 ? { displayOrder: Number(body.displayOrder) } : {}),
      ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
    });
    if (!variant) return NextResponse.json({ message: "Variant not found." }, { status: 404 });
    return NextResponse.json({ variant });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A variant with this name already exists." }, { status: 409 });
    }
    console.error("Update catalog service variant failed", error);
    return NextResponse.json({ message: "Unable to update variant." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import { updateCatalogService } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const { id } = await params;
  const service = await updateCatalogService(id, {
    ...(typeof body.categoryId === "string" ? { categoryId: body.categoryId } : {}),
    ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim().slice(0, 100) } : {}),
    ...(typeof body.imagePath === "string" ? { imagePath: body.imagePath.trim().slice(0, 250) } : {}),
    ...(body.unit === "kg" || body.unit === "item" ? { unit: body.unit } : {}),
    ...(Number.isFinite(Number(body.regularPrice)) ? { regularPrice: Number(body.regularPrice) } : {}),
    ...(body.expressPrice === null ? { expressPrice: null } : Number.isFinite(Number(body.expressPrice)) ? { expressPrice: Number(body.expressPrice) } : {}),
    ...(typeof body.turnaround === "string" && body.turnaround.trim() ? { turnaround: body.turnaround.trim().slice(0, 60) } : {}),
    ...(Number.isInteger(Number(body.displayOrder)) ? { displayOrder: Number(body.displayOrder) } : {}),
    ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
  });
  if (!service) return NextResponse.json({ message: "Service not found." }, { status: 404 });
  return NextResponse.json({ service });
}

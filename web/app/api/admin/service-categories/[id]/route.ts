import { NextResponse } from "next/server";

import { deleteServiceCategory, updateServiceCategory } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const { id } = await params;
  const category = await updateServiceCategory(id, {
    ...(typeof body.name === "string" && body.name.trim() ? { name: body.name.trim().slice(0, 80) } : {}),
    ...(typeof body.imagePath === "string" ? { imagePath: body.imagePath.trim().slice(0, 250) } : {}),
    ...(Number.isInteger(Number(body.displayOrder)) ? { displayOrder: Number(body.displayOrder) } : {}),
    ...(typeof body.isActive === "boolean" ? { isActive: body.isActive } : {}),
  });
  if (!category) return NextResponse.json({ message: "Category not found." }, { status: 404 });
  return NextResponse.json({ category });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    const deleted = await deleteServiceCategory(id);
    if (!deleted) return NextResponse.json({ message: "Category not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete service category failed", error);
    return NextResponse.json({ message: "Unable to delete category." }, { status: 500 });
  }
}

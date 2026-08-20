import { NextResponse } from "next/server";

import { deleteItemCategory, updateItemCategory } from "@/lib/item-master";
import { getCurrentUser } from "@/lib/session";

async function authorized() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ message: "Invalid category." }, { status: 400 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const category = await updateItemCategory(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      description: typeof body.description === "string" ? body.description.slice(0, 1000) : undefined,
      imagePath: typeof body.imagePath === "string" ? body.imagePath.slice(0, 250) : undefined,
      sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder),
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
    });
    return category ? NextResponse.json({ category }) : NextResponse.json({ message: "Category not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") return NextResponse.json({ message: "A category with this name already exists." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update category." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const deleted = await deleteItemCategory(Number((await context.params).id));
    return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "Category not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to delete category." }, { status: 409 });
  }
}

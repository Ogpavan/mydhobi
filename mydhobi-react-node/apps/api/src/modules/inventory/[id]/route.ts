import { HttpResponse } from "@/server/http-response";

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

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const item = await getInventoryItemById(
    (await params).id,
    user.role === "store_manager" ? user.storeId : null,
  );
  return item
    ? HttpResponse.json({ item })
    : HttpResponse.json({ message: "Item not found." }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role === "customer" ||
    (user.role === "store_manager" && !user.storeId)
  )
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (
      Object.keys(body).length === 1 &&
      (body.status === "active" || body.status === "inactive")
    ) {
      const item = await updateInventoryItemStatus(
        id,
        body.status,
        user.role === "store_manager" ? user.storeId : null,
      );
      return item
        ? HttpResponse.json({ item })
        : HttpResponse.json({ message: "Item not found." }, { status: 404 });
    }
    const payload = normalizeInventoryPayload(body);
    const error = validateInventoryPayload(payload);
    if (error) return HttpResponse.json({ message: error }, { status: 400 });
    if (
      !(await isActiveInventorySelection(payload.category, payload.unitType))
    ) {
      return HttpResponse.json(
        { message: "Select an active category and its linked unit type." },
        { status: 400 },
      );
    }
    const item = await updateInventoryItem(
      id,
      payload,
      user.role === "store_manager" ? user.storeId : null,
    );
    return item
      ? HttpResponse.json({ item })
      : HttpResponse.json({ message: "Item not found." }, { status: 404 });
  } catch (error) {
    console.error("Update inventory item failed", error);
    return HttpResponse.json(
      { message: "Unable to update item right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role === "customer" ||
    (user.role === "store_manager" && !user.storeId)
  )
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    return (await deleteInventoryItem(
      (await params).id,
      user.role === "store_manager" ? user.storeId : null,
    ))
      ? HttpResponse.json({ ok: true })
      : HttpResponse.json({ message: "Item not found." }, { status: 404 });
  } catch (error) {
    console.error("Delete inventory item failed", error);
    return HttpResponse.json(
      { message: "Unable to delete item right now." },
      { status: 500 },
    );
  }
}

import { HttpResponse } from "@/server/http-response";

import {
  createInventoryItem,
  listInventoryItems,
  normalizeInventoryPayload,
  validateInventoryPayload,
} from "@/lib/inventory";
import { isActiveInventorySelection } from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    return HttpResponse.json({
      items: await listInventoryItems(
        user.role === "store_manager" ? user.storeId : null,
      ),
    });
  } catch (error) {
    console.error("List inventory failed", error);
    return HttpResponse.json(
      { message: "Unable to load inventory right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role === "customer" ||
    (user.role === "store_manager" && !user.storeId)
  ) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = normalizeInventoryPayload(
      (await request.json()) as Record<string, unknown>,
    );
    const validationError = validateInventoryPayload(payload);
    if (validationError) {
      return HttpResponse.json({ message: validationError }, { status: 400 });
    }
    if (
      !(await isActiveInventorySelection(payload.category, payload.unitType))
    ) {
      return HttpResponse.json(
        { message: "Select an active category and its linked unit type." },
        { status: 400 },
      );
    }
    return HttpResponse.json(
      {
        item: await createInventoryItem(
          payload,
          user.role === "store_manager" ? user.storeId : null,
        ),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create inventory item failed", error);
    return HttpResponse.json(
      { message: "Unable to add item right now." },
      { status: 500 },
    );
  }
}

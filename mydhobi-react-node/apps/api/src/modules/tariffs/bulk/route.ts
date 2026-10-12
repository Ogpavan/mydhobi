import { HttpResponse } from "@/server/http-response";

import { getCurrentUser } from "@/lib/session";
import { updateTariffs, type TariffChange } from "@/lib/tariffs";

const MAX_PRICE = 9_999_999_999.99;
const MAX_CHANGES = 10_000;

function parseChange(value: unknown): TariffChange | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  const itemId = Number(entry.itemId);
  const serviceId = Number(entry.serviceId);
  const isAvailable = entry.isAvailable === true;
  const price =
    isAvailable && typeof entry.price === "number" ? entry.price : null;

  if (
    !Number.isInteger(itemId) ||
    itemId < 1 ||
    !Number.isInteger(serviceId) ||
    serviceId < 1 ||
    typeof entry.isAvailable !== "boolean" ||
    (isAvailable &&
      (!Number.isFinite(price) ||
        price === null ||
        price < 0 ||
        price > MAX_PRICE))
  )
    return null;

  return { itemId, serviceId, price, isAvailable };
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const groupId = Number(body.groupId);
    const rawChanges = Array.isArray(body.changes) ? body.changes : null;
    if (!Number.isInteger(groupId) || groupId < 1)
      return HttpResponse.json(
        { message: "Choose a price list." },
        { status: 400 },
      );
    if (!rawChanges || rawChanges.length > MAX_CHANGES) {
      return HttpResponse.json(
        { message: "Send a valid list of tariff changes." },
        { status: 400 },
      );
    }

    const changes = rawChanges.map(parseChange);
    if (changes.some((change) => change === null)) {
      return HttpResponse.json(
        { message: "Enter a valid price for each available service." },
        { status: 400 },
      );
    }
    const validChanges = changes as TariffChange[];
    const uniqueKeys = new Set(
      validChanges.map((change) => `${change.itemId}:${change.serviceId}`),
    );
    if (uniqueKeys.size !== validChanges.length) {
      return HttpResponse.json(
        { message: "Each item and service can appear only once." },
        { status: 400 },
      );
    }

    const updated = await updateTariffs(groupId, validChanges);
    return HttpResponse.json({ updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to save tariffs.";
    return HttpResponse.json({ message }, { status: 400 });
  }
}

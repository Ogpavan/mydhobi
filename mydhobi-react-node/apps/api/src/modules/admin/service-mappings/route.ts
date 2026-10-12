import { HttpResponse } from "@/server/http-response";

import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";
import {
  getServiceMappingSheet,
  updateServiceMappings,
  type ServiceMappingChange,
} from "@/lib/service-mappings";
import { getCurrentUser } from "@/lib/session";

async function authorized() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" && user.role !== "store_manager"
    ? user
    : null;
}

export async function GET(request: Request) {
  if (!(await authorized()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const categoryId = Number(
    new URL(request.url).searchParams.get("categoryId"),
  );
  if (!Number.isInteger(categoryId) || categoryId < 1) {
    return HttpResponse.json(
      { message: "Choose a valid category." },
      { status: 400 },
    );
  }
  try {
    return HttpResponse.json(await getServiceMappingSheet(categoryId), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return HttpResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load service mappings.",
      },
      { status: 500 },
    );
  }
}

function parseChange(value: unknown): ServiceMappingChange | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Record<string, unknown>;
  const itemId = Number(entry.itemId);
  const serviceId = Number(entry.serviceId);
  const pricingUnit = entry.pricingUnit as PricingUnit;
  if (
    !Number.isInteger(itemId) ||
    itemId < 1 ||
    !Number.isInteger(serviceId) ||
    serviceId < 1 ||
    typeof entry.isMapped !== "boolean" ||
    !PRICING_UNITS.includes(pricingUnit)
  )
    return null;
  return { itemId, serviceId, isMapped: entry.isMapped, pricingUnit };
}

export async function PATCH(request: Request) {
  if (!(await authorized()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rawChanges = Array.isArray(body.changes) ? body.changes : null;
    if (!rawChanges || rawChanges.length > 10_000) {
      return HttpResponse.json(
        { message: "Send a valid list of mapping changes." },
        { status: 400 },
      );
    }
    const changes = rawChanges.map(parseChange);
    if (changes.some((change) => change === null)) {
      return HttpResponse.json(
        { message: "Choose a valid item, service, and billing unit." },
        { status: 400 },
      );
    }
    const validChanges = changes as ServiceMappingChange[];
    const uniqueKeys = new Set(
      validChanges.map((change) => `${change.itemId}:${change.serviceId}`),
    );
    if (uniqueKeys.size !== validChanges.length) {
      return HttpResponse.json(
        { message: "Each item and service can appear only once." },
        { status: 400 },
      );
    }
    return HttpResponse.json({
      updated: await updateServiceMappings(validChanges),
    });
  } catch (error) {
    return HttpResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to save service mappings.",
      },
      { status: 400 },
    );
  }
}

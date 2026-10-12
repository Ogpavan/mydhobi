import { HttpResponse } from "@/server/http-response";

import { deactivateStoreOffersOutsidePolicy } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";
import {
  deleteStore,
  getStoreById,
  normalizeStorePayload,
  updateStore,
  updateStoreStatus,
  validateStorePayload,
} from "@/lib/stores";

type StoreRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function GET(_request: Request, { params }: StoreRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    return HttpResponse.json({ message: "Store not found." }, { status: 404 });
  }

  return HttpResponse.json({ store });
}

export async function PATCH(request: Request, { params }: StoreRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const requestBody = (await request.json()) as { status?: unknown } & Record<
      string,
      unknown
    >;
    if (requestBody.status === "active" || requestBody.status === "inactive") {
      const store = await updateStoreStatus(id, requestBody.status);
      return store
        ? HttpResponse.json({ store })
        : HttpResponse.json({ message: "Store not found." }, { status: 404 });
    }
    const currentStore = await getStoreById(id);
    if (!currentStore) {
      return HttpResponse.json(
        { message: "Store not found." },
        { status: 404 },
      );
    }
    const payload = normalizeStorePayload(
      requestBody as Parameters<typeof normalizeStorePayload>[0],
    );
    if (user.role !== "admin") {
      payload.discountsEnabled = currentStore.discountsEnabled;
      payload.maxDiscountPercent = currentStore.maxDiscountPercent;
      payload.maxDiscountAmount = currentStore.maxDiscountAmount;
      payload.discountGroupId = currentStore.discountGroupId;
    }
    const error = validateStorePayload(payload);

    if (error) {
      return HttpResponse.json({ message: error }, { status: 400 });
    }

    const store = await updateStore(id, payload);

    if (!store) {
      return HttpResponse.json(
        { message: "Store not found." },
        { status: 404 },
      );
    }

    if (user.role === "admin") {
      await deactivateStoreOffersOutsidePolicy(id, {
        discountsEnabled: store.discountsEnabled,
        maxDiscountPercent: store.maxDiscountPercent,
        maxDiscountAmount: store.maxDiscountAmount,
      });
    }

    return HttpResponse.json({ store });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return HttpResponse.json(
        { message: "A store with this email already exists." },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      error.message === "DISCOUNT_GROUP_NOT_FOUND"
    ) {
      return HttpResponse.json(
        { message: "Choose an active discount group." },
        { status: 400 },
      );
    }

    console.error("Update store failed", error);

    return HttpResponse.json(
      { message: "Unable to update store right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: StoreRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteStore(id);

  if (!deleted) {
    return HttpResponse.json({ message: "Store not found." }, { status: 404 });
  }

  return HttpResponse.json({ ok: true });
}

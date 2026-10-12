import { HttpResponse } from "@/server/http-response";

import { getCurrentUser } from "@/lib/session";
import {
  createStore,
  listStores,
  normalizeStorePayload,
  validateStorePayload,
} from "@/lib/stores";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const stores = await listStores();

  return HttpResponse.json({ stores });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = normalizeStorePayload(await request.json());
    if (user.role !== "admin") {
      payload.discountsEnabled = false;
      payload.maxDiscountPercent = 0;
      payload.maxDiscountAmount = 0;
      payload.discountGroupId = null;
    }
    const error = validateStorePayload(payload);

    if (error) {
      return HttpResponse.json({ message: error }, { status: 400 });
    }

    const store = await createStore(payload);

    return HttpResponse.json({ store }, { status: 201 });
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

    console.error("Create store failed", error);

    return HttpResponse.json(
      { message: "Unable to create store right now." },
      { status: 500 },
    );
  }
}

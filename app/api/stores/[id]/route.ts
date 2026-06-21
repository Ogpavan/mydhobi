import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import {
  deleteStore,
  getStoreById,
  normalizeStorePayload,
  updateStore,
  validateStorePayload,
} from "@/lib/stores";

export const runtime = "nodejs";

type StoreRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    error.code === "23505";
}

export async function GET(_request: Request, { params }: StoreRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    return NextResponse.json({ message: "Store not found." }, { status: 404 });
  }

  return NextResponse.json({ store });
}

export async function PATCH(request: Request, { params }: StoreRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const payload = normalizeStorePayload(await request.json());
    const error = validateStorePayload(payload);

    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }

    const store = await updateStore(id, payload);

    if (!store) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({ store });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "A store with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Update store failed", error);

    return NextResponse.json(
      { message: "Unable to update store right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: StoreRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteStore(id);

  if (!deleted) {
    return NextResponse.json({ message: "Store not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

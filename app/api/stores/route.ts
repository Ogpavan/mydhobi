import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import {
  createStore,
  listStores,
  normalizeStorePayload,
  validateStorePayload,
} from "@/lib/stores";

export const runtime = "nodejs";

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    error.code === "23505";
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const stores = await listStores();

  return NextResponse.json({ stores });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = normalizeStorePayload(await request.json());
    const error = validateStorePayload(payload);

    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }

    const store = await createStore(payload);

    return NextResponse.json({ store }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "A store with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Create store failed", error);

    return NextResponse.json(
      { message: "Unable to create store right now." },
      { status: 500 },
    );
  }
}

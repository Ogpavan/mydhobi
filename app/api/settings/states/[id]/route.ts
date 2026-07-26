import { NextResponse } from "next/server";

import {
  deleteSetupState,
  normalizeLocationName,
  updateSetupState,
  updateSetupStateStatus,
  validateLocationName,
} from "@/lib/locations";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function getDatabaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      name?: unknown;
      isActive?: unknown;
    };

    if (typeof body.isActive === "boolean") {
      const state = await updateSetupStateStatus(id, body.isActive);
      return state
        ? NextResponse.json({ state })
        : NextResponse.json({ message: "State not found." }, { status: 404 });
    }

    const name = normalizeLocationName(body.name);
    const error = validateLocationName(name, "State");

    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }

    const state = await updateSetupState(id, name);
    return state
      ? NextResponse.json({ state })
      : NextResponse.json({ message: "State not found." }, { status: 404 });
  } catch (error) {
    if (getDatabaseErrorCode(error) === "23505") {
      return NextResponse.json(
        { message: "This state already exists." },
        { status: 409 },
      );
    }

    console.error("Update state failed", error);
    return NextResponse.json(
      { message: "Unable to update state right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  if (!(await getCurrentUser())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const deleted = await deleteSetupState(id);
    return deleted
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ message: "State not found." }, { status: 404 });
  } catch (error) {
    if (getDatabaseErrorCode(error) === "23503") {
      return NextResponse.json(
        { message: "Delete this state's cities first." },
        { status: 409 },
      );
    }

    console.error("Delete state failed", error);
    return NextResponse.json(
      { message: "Unable to delete state right now." },
      { status: 500 },
    );
  }
}

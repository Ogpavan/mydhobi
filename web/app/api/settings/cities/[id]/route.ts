import { NextResponse } from "next/server";

import {
  deleteSetupCity,
  normalizeLocationName,
  updateSetupCity,
  updateSetupCityStatus,
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
      stateId?: unknown;
      isActive?: unknown;
    };

    if (typeof body.isActive === "boolean") {
      const city = await updateSetupCityStatus(id, body.isActive);
      return city
        ? NextResponse.json({ city })
        : NextResponse.json({ message: "City not found." }, { status: 404 });
    }

    const name = normalizeLocationName(body.name);
    const stateId = typeof body.stateId === "string" ? body.stateId : "";
    const error = validateLocationName(name, "City");

    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }
    if (!stateId) {
      return NextResponse.json({ message: "Select a state." }, { status: 400 });
    }

    const city = await updateSetupCity(id, name, stateId);
    return city
      ? NextResponse.json({ city })
      : NextResponse.json({ message: "City not found." }, { status: 404 });
  } catch (error) {
    const code = getDatabaseErrorCode(error);
    if (code === "23505") {
      return NextResponse.json(
        { message: "This city already exists in the selected state." },
        { status: 409 },
      );
    }
    if (code === "23503" || code === "22P02") {
      return NextResponse.json({ message: "Select a valid state." }, { status: 400 });
    }

    console.error("Update city failed", error);
    return NextResponse.json(
      { message: "Unable to update city right now." },
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
    const deleted = await deleteSetupCity(id);
    return deleted
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ message: "City not found." }, { status: 404 });
  } catch (error) {
    console.error("Delete city failed", error);
    return NextResponse.json(
      { message: "Unable to delete city right now." },
      { status: 500 },
    );
  }
}

import { HttpResponse } from "@/server/http-response";

import {
  createSetupCity,
  listSetupCities,
  normalizeLocationName,
  validateLocationName,
} from "@/lib/locations";
import { getCurrentUser } from "@/lib/session";

function getDatabaseErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error
    ? error.code
    : null;
}

export async function GET() {
  if (!(await getCurrentUser())) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return HttpResponse.json({ cities: await listSetupCities() });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: unknown;
      stateId?: unknown;
    };
    const name = normalizeLocationName(body.name);
    const stateId = typeof body.stateId === "string" ? body.stateId : "";
    const error = validateLocationName(name, "City");

    if (error) {
      return HttpResponse.json({ message: error }, { status: 400 });
    }

    if (!stateId) {
      return HttpResponse.json({ message: "Select a state." }, { status: 400 });
    }

    const city = await createSetupCity(name, stateId);
    return city
      ? HttpResponse.json({ city }, { status: 201 })
      : HttpResponse.json({ message: "State not found." }, { status: 404 });
  } catch (error) {
    const code = getDatabaseErrorCode(error);
    if (code === "23505") {
      return HttpResponse.json(
        { message: "This city already exists in the selected state." },
        { status: 409 },
      );
    }
    if (code === "23503" || code === "22P02") {
      return HttpResponse.json(
        { message: "Select a valid state." },
        { status: 400 },
      );
    }

    console.error("Create city failed", error);
    return HttpResponse.json(
      { message: "Unable to add city right now." },
      { status: 500 },
    );
  }
}

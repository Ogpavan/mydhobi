import { HttpResponse } from "@/server/http-response";

import {
  createSetupState,
  listSetupStates,
  normalizeLocationName,
  validateLocationName,
} from "@/lib/locations";
import { getCurrentUser } from "@/lib/session";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function GET() {
  if (!(await getCurrentUser())) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return HttpResponse.json({ states: await listSetupStates() });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { name?: unknown };
    const name = normalizeLocationName(body.name);
    const error = validateLocationName(name, "State");

    if (error) {
      return HttpResponse.json({ message: error }, { status: 400 });
    }

    return HttpResponse.json(
      { state: await createSetupState(name) },
      { status: 201 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return HttpResponse.json(
        { message: "This state already exists." },
        { status: 409 },
      );
    }

    console.error("Create state failed", error);
    return HttpResponse.json(
      { message: "Unable to add state right now." },
      { status: 500 },
    );
  }
}

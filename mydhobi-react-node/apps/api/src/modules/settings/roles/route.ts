import {
  createSetupRole,
  listSetupRoles,
  normalizeRolePayload,
  validateRolePayload,
} from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { HttpResponse } from "@/server/http-response";

export async function GET() {
  if (!(await getCurrentUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  return HttpResponse.json({ roles: await listSetupRoles() });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const payload = normalizeRolePayload(await request.json());
    const error = validateRolePayload(payload);
    if (error) return HttpResponse.json({ message: error }, { status: 400 });
    return HttpResponse.json(
      { role: await createSetupRole(payload.name, payload.description) },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return HttpResponse.json(
        { message: "A role with this name already exists." },
        { status: 409 },
      );
    }
    console.error("Create role failed", error);
    return HttpResponse.json(
      { message: "Unable to create role right now." },
      { status: 500 },
    );
  }
}

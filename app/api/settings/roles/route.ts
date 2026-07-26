import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { createSetupRole, listSetupRoles, normalizeRolePayload, validateRolePayload } from "@/lib/roles";

export const runtime = "nodejs";

export async function GET() {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ roles: await listSetupRoles() });
}

export async function POST(request: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const payload = normalizeRolePayload(await request.json());
    const error = validateRolePayload(payload);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    return NextResponse.json({ role: await createSetupRole(payload.name, payload.description) }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A role with this name already exists." }, { status: 409 });
    }
    console.error("Create role failed", error);
    return NextResponse.json({ message: "Unable to create role right now." }, { status: 500 });
  }
}

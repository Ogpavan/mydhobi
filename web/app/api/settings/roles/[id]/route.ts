import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { deleteSetupRole, normalizeRolePayload, updateSetupRole, updateSetupRoleStatus, validateRolePayload } from "@/lib/roles";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json() as { isActive?: boolean; name?: unknown; description?: unknown };
    if (typeof body.isActive === "boolean") {
      const role = await updateSetupRoleStatus(id, body.isActive);
      return role ? NextResponse.json({ role }) : NextResponse.json({ message: "Role not found." }, { status: 404 });
    }
    const payload = normalizeRolePayload(body);
    const error = validateRolePayload(payload);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    const role = await updateSetupRole(id, payload.name, payload.description);
    return role ? NextResponse.json({ role }) : NextResponse.json({ message: "Role not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A role with this name already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Unable to update role right now." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await getCurrentUser())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const deleted = await deleteSetupRole((await params).id);
  return deleted ? NextResponse.json({ ok: true }) : NextResponse.json({ message: "Role not found." }, { status: 404 });
}

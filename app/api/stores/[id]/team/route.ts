import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { getStoreById } from "@/lib/stores";
import {
  createStoreTeamMember,
  deleteStoreTeamMember,
  listStoreTeamMembers,
  normalizeStoreTeamPayload,
  validateStoreTeamPayload,
  updateStoreTeamMember,
} from "@/lib/store-team";

export const runtime = "nodejs";

type StoreTeamRouteContext = {
  params: Promise<{ id: string }>;
};

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error &&
    error.code === "23505";
}

export async function GET(_request: Request, { params }: StoreTeamRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const store = await getStoreById(id);

  if (!store) {
    return NextResponse.json({ message: "Store not found." }, { status: 404 });
  }

  const members = await listStoreTeamMembers(id);
  return NextResponse.json({ members });
}

export async function POST(request: Request, { params }: StoreTeamRouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const store = await getStoreById(id);

    if (!store) {
      return NextResponse.json({ message: "Store not found." }, { status: 404 });
    }

    const payload = normalizeStoreTeamPayload(await request.json());
    const validationError = validateStoreTeamPayload(payload);

    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 });
    }

    const member = await createStoreTeamMember(id, payload);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "This mobile number is already added to this store." },
        { status: 409 },
      );
    }

    console.error("Create store team member failed", error);
    return NextResponse.json(
      { message: "Unable to add team member right now." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: StoreTeamRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id: storeId } = await params;
    const body = await request.json() as { memberId?: string; status?: string } & Partial<import("@/lib/store-team").StoreTeamPayload>;
    if (!body.memberId) return NextResponse.json({ message: "Member is required." }, { status: 400 });
    if (body.status === "active" || body.status === "disabled") {
      const existing = await listStoreTeamMembers(storeId);
      const member = existing.find((item) => item.id === body.memberId);
      if (!member) return NextResponse.json({ message: "Team member not found." }, { status: 404 });
      const updated = await updateStoreTeamMember(member.id, { ...member, status: body.status });
      return NextResponse.json({ member: updated });
    }
    const payload = normalizeStoreTeamPayload(body);
    const error = validateStoreTeamPayload(payload);
    if (error) return NextResponse.json({ message: error }, { status: 400 });
    const updated = await updateStoreTeamMember(body.memberId, payload);
    return updated ? NextResponse.json({ member: updated }) : NextResponse.json({ message: "Team member not found." }, { status: 404 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return NextResponse.json({ message: "This mobile number is already added to this store." }, { status: 409 });
    return NextResponse.json({ message: "Unable to update team member right now." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: StoreTeamRouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const { id: storeId } = await params;
  const memberId = new URL(request.url).searchParams.get("memberId");
  if (!memberId) return NextResponse.json({ message: "Member is required." }, { status: 400 });
  const member = (await listStoreTeamMembers(storeId)).find((item) => item.id === memberId);
  if (!member || !(await deleteStoreTeamMember(memberId))) return NextResponse.json({ message: "Team member not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

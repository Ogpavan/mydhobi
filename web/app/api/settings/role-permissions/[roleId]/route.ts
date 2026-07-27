import { NextResponse } from "next/server";

import {
  saveRolePermissions,
  validatePermissionPageKeys,
} from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

type Context = {
  params: Promise<{ roleId: string }>;
};

export async function PUT(request: Request, { params }: Context) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roleId } = await params;

    if (!/^\d+$/.test(roleId)) {
      return NextResponse.json({ message: "Role not found." }, { status: 404 });
    }

    const body = (await request.json()) as { pageKeys?: unknown };
    const validated = validatePermissionPageKeys(body.pageKeys);

    if (validated.error) {
      return NextResponse.json(
        { message: validated.error },
        { status: 400 },
      );
    }

    const pageKeys = await saveRolePermissions(roleId, validated.pageKeys);

    if (!pageKeys) {
      return NextResponse.json({ message: "Role not found." }, { status: 404 });
    }

    return NextResponse.json({ pageKeys });
  } catch (error) {
    console.error("Save role permissions failed", error);
    return NextResponse.json(
      { message: "Unable to save page access right now." },
      { status: 500 },
    );
  }
}

import { HttpResponse } from "@/server/http-response";

import {
  saveRolePermissions,
  validatePermissionPageKeys,
} from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";

type Context = {
  params: Promise<{ roleId: string }>;
};

export async function PUT(request: Request, { params }: Context) {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { roleId } = await params;

    if (!/^\d+$/.test(roleId)) {
      return HttpResponse.json({ message: "Role not found." }, { status: 404 });
    }

    const body = (await request.json()) as { pageKeys?: unknown };
    const validated = validatePermissionPageKeys(body.pageKeys);

    if (validated.error) {
      return HttpResponse.json({ message: validated.error }, { status: 400 });
    }

    const pageKeys = await saveRolePermissions(roleId, validated.pageKeys);

    if (!pageKeys) {
      return HttpResponse.json({ message: "Role not found." }, { status: 404 });
    }

    return HttpResponse.json({ pageKeys });
  } catch (error) {
    console.error("Save role permissions failed", error);
    return HttpResponse.json(
      { message: "Unable to save page access right now." },
      { status: 500 },
    );
  }
}

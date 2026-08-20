import { NextResponse } from "next/server";

import { updateItemService } from "@/lib/item-master";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const service = await updateItemService(Number((await context.params).id), { name: typeof body.name === "string" ? body.name : undefined, description: typeof body.description === "string" ? body.description.slice(0, 1000) : undefined, isActive: typeof body.isActive === "boolean" ? body.isActive : undefined, sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder) });
    return service ? NextResponse.json({ service }) : NextResponse.json({ message: "Service not found." }, { status: 404 });
  } catch { return NextResponse.json({ message: "Unable to update service." }, { status: 500 }); }
}

import { HttpResponse } from "@/server/http-response";

import {
  deleteSetupInventoryUnit,
  normalizeInventorySetupName,
  updateSetupInventoryUnit,
  updateSetupInventoryUnitStatus,
  validateInventorySetupName,
} from "@/lib/inventory-setup";
import { getCurrentUser } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  if (!(await getCurrentUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      name?: unknown;
      isActive?: unknown;
    };
    if (typeof body.isActive === "boolean") {
      const result = await updateSetupInventoryUnitStatus(id, body.isActive);
      if (result.usedByActiveCategory) {
        return HttpResponse.json(
          { message: "Make linked categories inactive first." },
          { status: 409 },
        );
      }
      return result.unit
        ? HttpResponse.json({ unit: result.unit })
        : HttpResponse.json(
            { message: "Unit type not found." },
            { status: 404 },
          );
    }
    const name = normalizeInventorySetupName(body.name);
    const error = validateInventorySetupName(name, "Unit type");
    if (error) return HttpResponse.json({ message: error }, { status: 400 });
    const unit = await updateSetupInventoryUnit(id, name);
    return unit
      ? HttpResponse.json({ unit })
      : HttpResponse.json({ message: "Unit type not found." }, { status: 404 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      return HttpResponse.json(
        { message: "This unit type already exists." },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { message: "Unable to update unit type right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await getCurrentUser()))
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    return (await deleteSetupInventoryUnit((await params).id))
      ? HttpResponse.json({ ok: true })
      : HttpResponse.json({ message: "Unit type not found." }, { status: 404 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23503"
    ) {
      return HttpResponse.json(
        { message: "This unit type is linked to a category." },
        { status: 409 },
      );
    }
    return HttpResponse.json(
      { message: "Unable to delete unit type right now." },
      { status: 500 },
    );
  }
}

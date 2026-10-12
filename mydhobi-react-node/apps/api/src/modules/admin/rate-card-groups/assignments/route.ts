import { HttpResponse } from "@/server/http-response";

import {
  assignRateCardsToStores,
  assignRateCardToStore,
  listRateCardStoreAssignments,
} from "@/lib/rate-card-groups";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  return HttpResponse.json({
    assignments: await listRateCardStoreAssignments(),
  });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (Array.isArray(body.assignments)) {
      const assignments = body.assignments.map((value) => {
        if (!value || typeof value !== "object") return null;
        const entry = value as Record<string, unknown>;
        const storeId =
          typeof entry.storeId === "string" ? entry.storeId.trim() : "";
        const groupId =
          entry.groupId === null ||
          entry.groupId === "" ||
          entry.groupId === undefined
            ? null
            : Number(entry.groupId);
        if (
          !storeId ||
          (groupId !== null && (!Number.isInteger(groupId) || groupId < 1))
        )
          return null;
        return { storeId, groupId };
      });
      if (
        assignments.length > 500 ||
        assignments.some((entry) => entry === null)
      )
        return HttpResponse.json(
          { message: "Check the store assignments." },
          { status: 400 },
        );
      const validAssignments = assignments as Array<{
        storeId: string;
        groupId: number | null;
      }>;
      if (
        new Set(validAssignments.map((entry) => entry.storeId)).size !==
        validAssignments.length
      )
        return HttpResponse.json(
          { message: "Each store can appear only once." },
          { status: 400 },
        );
      await assignRateCardsToStores(validAssignments);
      return HttpResponse.json({
        assignments: await listRateCardStoreAssignments(),
      });
    }
    const storeId = typeof body.storeId === "string" ? body.storeId : "";
    const groupId =
      body.groupId === null || body.groupId === "" || body.groupId === undefined
        ? null
        : Number(body.groupId);
    if (
      !storeId ||
      (groupId !== null && (!Number.isInteger(groupId) || groupId < 1))
    )
      return HttpResponse.json(
        { message: "Choose a store and tariff card." },
        { status: 400 },
      );
    await assignRateCardToStore(storeId, groupId);
    return HttpResponse.json({ ok: true });
  } catch (error) {
    return HttpResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to assign tariff card.",
      },
      { status: 400 },
    );
  }
}

import { HttpResponse } from "@/server/http-response";
import { assignDiscountGroupToStore } from "@/lib/discount-groups";
import { getCurrentUser } from "@/lib/session";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin")
    return HttpResponse.json({ message: "Admin access is required." }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const storeId = typeof body.storeId === "string" ? body.storeId.trim() : "";
    const rawGroupId = body.discountGroupId;
    const groupId = rawGroupId === null || rawGroupId === "" ? null : Number(rawGroupId);
    if (!storeId || (groupId !== null && (!Number.isInteger(groupId) || groupId < 1)))
      return HttpResponse.json({ message: "Choose a valid store and discount group." }, { status: 400 });
    return HttpResponse.json({ discountGroupId: await assignDiscountGroupToStore(storeId, groupId) });
  } catch (error) {
    if (error instanceof Error && error.message === "STORE_NOT_FOUND")
      return HttpResponse.json({ message: "Store not found." }, { status: 404 });
    if (error instanceof Error && error.message === "DISCOUNT_GROUP_NOT_FOUND")
      return HttpResponse.json({ message: "Choose an active discount group." }, { status: 400 });
    return HttpResponse.json({ message: "Unable to assign discount group." }, { status: 500 });
  }
}

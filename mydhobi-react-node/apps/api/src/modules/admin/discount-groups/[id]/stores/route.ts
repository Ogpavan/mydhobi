import { HttpResponse } from "@/server/http-response";
import { listDiscountGroupStores } from "@/lib/discount-groups";
import { getCurrentUser } from "@/lib/session";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin")
    return HttpResponse.json(
      { message: "Admin access is required." },
      { status: 403 },
    );
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1)
    return HttpResponse.json(
      { message: "Discount group not found." },
      { status: 404 },
    );
  const stores = await listDiscountGroupStores(id);
  return stores === null
    ? HttpResponse.json(
        { message: "Discount group not found." },
        { status: 404 },
      )
    : HttpResponse.json({ stores });
}

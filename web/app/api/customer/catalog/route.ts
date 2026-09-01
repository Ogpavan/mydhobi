import { NextResponse } from "next/server";

import { listCustomerItemCatalog } from "@/lib/item-master";
import { listOffers } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";
import { resolveCustomerStoreId } from "@/lib/customer-portal";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const storeId = await resolveCustomerStoreId(user.id);
  const [{ categories, services }, offers] = await Promise.all([
    listCustomerItemCatalog(storeId),
    listOffers(true, storeId),
  ]);
  return NextResponse.json({ categories, services, offers });
}

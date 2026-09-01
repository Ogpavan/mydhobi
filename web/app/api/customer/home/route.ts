import { NextResponse } from "next/server";

import {
  getPortalWallet,
  listPortalAddresses,
  listPortalNotifications,
  resolveCustomerStoreId,
} from "@/lib/customer-portal";
import { listOffers } from "@/lib/offers";
import { listCustomerItemCatalog } from "@/lib/item-master";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const storeId = await resolveCustomerStoreId(user.id);
  const [wallet, categories, addresses, notifications, offers] = await Promise.all([
    getPortalWallet(user.id),
    listCustomerItemCatalog(storeId).then((catalog) => catalog.categories),
    listPortalAddresses(user.id),
    listPortalNotifications(user.id),
    listOffers(true, storeId),
  ]);

  return NextResponse.json({
    user,
    wallet,
    categories,
    addresses,
    notifications,
    offers,
  });
}

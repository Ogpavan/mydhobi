import { NextResponse } from "next/server";

import {
  getPortalWallet,
  listPortalAddresses,
  listPortalNotifications,
} from "@/lib/customer-portal";
import { listOffers } from "@/lib/offers";
import { listCatalogServices } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [wallet, services, addresses, notifications, offers] = await Promise.all([
    getPortalWallet(user.id),
    listCatalogServices(false),
    listPortalAddresses(user.id),
    listPortalNotifications(user.id),
    listOffers(true),
  ]);

  return NextResponse.json({
    user,
    wallet,
    services,
    addresses,
    notifications,
    offers,
  });
}

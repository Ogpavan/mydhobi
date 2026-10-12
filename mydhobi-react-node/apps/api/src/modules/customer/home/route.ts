import { HttpResponse } from "@/server/http-response";

import {
  listPortalAddresses,
  listPortalNotifications,
  resolveCustomerStoreId,
} from "@/lib/customer-portal";
import { listOffers } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const storeId = await resolveCustomerStoreId(user.id);
  const [addresses, notifications, offers] = await Promise.all([
    listPortalAddresses(user.id),
    listPortalNotifications(user.id),
    listOffers(true, storeId),
  ]);

  return HttpResponse.json({
    user,
    addresses,
    notifications,
    offers,
  });
}

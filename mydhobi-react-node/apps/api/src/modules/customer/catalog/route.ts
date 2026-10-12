import { HttpResponse } from "@/server/http-response";

import { resolveCustomerStoreId } from "@/lib/customer-portal";
import { listCustomerItemCatalog, listItemCategories } from "@/lib/item-master";
import { listOffers } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";
import { pool } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer")
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  const storeId = await resolveCustomerStoreId(user.id);
  const [{ categories, services }, offers, categoryGroups] = await Promise.all([
    listCustomerItemCatalog(storeId, true),
    listOffers(true, storeId),
    listItemCategories(false),
  ]);
  const store = storeId
    ? (await pool.query("SELECT id,name FROM stores WHERE id=$1", [storeId]))
        .rows[0]
    : null;
  return HttpResponse.json({
    categories,
    categoryGroups: categoryGroups.map((category) => ({
      id: String(category.id),
      name: category.name,
      description: category.description,
      imagePath: category.imagePath,
      displayOrder: category.sortOrder,
      isActive: category.isActive,
    })),
    services,
    offers,
    store,
  });
}

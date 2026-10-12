import { HttpResponse } from "@/server/http-response";

import { listCustomers } from "@/lib/customers";
import { listActiveDiscountGroupPricing } from "@/lib/discount-groups";
import { listItemCategories } from "@/lib/item-master";
import { listOrderCharges } from "@/lib/order-charges";
import {
  getFirstConfiguredRateCardGroupId,
  listRateCardGroups,
  listRateCardStoreAssignments,
} from "@/lib/rate-card-groups";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";
import { getTariffSheet } from "@/lib/tariffs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return HttpResponse.json(
      { message: "You do not have access to orders." },
      { status: 403 },
    );
  }

  try {
    const [
      categories,
      allTariffs,
      customers,
      assignments,
      charges,
      discountGroups,
    ] = await Promise.all([
      listItemCategories(false),
      listRateCardGroups(false),
      listCustomers(user.role === "store_manager" ? user.storeId : null),
      listRateCardStoreAssignments(),
      listOrderCharges(false),
      listActiveDiscountGroupPricing(),
    ]);
    const assignedTariffId =
      user.role === "store_manager"
        ? (assignments.find((assignment) => assignment.storeId === user.storeId)
            ?.groupId ?? null)
        : null;
    const tariffs =
      user.role === "store_manager"
        ? allTariffs.filter((tariff) => tariff.id === assignedTariffId)
        : allTariffs;
    const url = new URL(request.url);
    const requestedTariff = url.searchParams.get("tariffId");
    const requestedCategory = url.searchParams.get("categoryId");
    const defaultTariffId =
      requestedTariff === null && user.role !== "store_manager"
        ? await getFirstConfiguredRateCardGroupId()
        : null;
    const tariffId =
      requestedTariff === null
        ? (defaultTariffId ?? tariffs[0]?.id ?? null)
        : Number(requestedTariff);
    const categoryId =
      requestedCategory === null
        ? (categories[0]?.id ?? null)
        : Number(requestedCategory);

    if (
      (tariffId !== null && (!Number.isInteger(tariffId) || tariffId < 1)) ||
      (categoryId !== null && (!Number.isInteger(categoryId) || categoryId < 1))
    ) {
      return HttpResponse.json(
        { message: "Choose a valid tariff and category." },
        { status: 400 },
      );
    }
    if (
      tariffId !== null &&
      !tariffs.some((tariff) => tariff.id === tariffId)
    ) {
      return HttpResponse.json(
        { message: "Tariff not found." },
        { status: 404 },
      );
    }
    if (
      categoryId !== null &&
      !categories.some((category) => category.id === categoryId)
    ) {
      return HttpResponse.json(
        { message: "Category not found." },
        { status: 404 },
      );
    }

    const sheet =
      tariffId !== null && categoryId !== null
        ? await getTariffSheet(tariffId, categoryId)
        : null;

    return HttpResponse.json(
      {
        categories,
        tariffs,
        customers: customers.filter((customer) => customer.status === "active"),
        charges,
        discountGroups,
        tariffId,
        categoryId,
        sheet,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Load booking data failed", error);
    return HttpResponse.json(
      { message: "Unable to load booking items." },
      { status: 500 },
    );
  }
}

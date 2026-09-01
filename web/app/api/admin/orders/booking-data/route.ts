import { NextResponse } from "next/server";

import { listCustomers } from "@/lib/customers";
import { listItemCategories } from "@/lib/item-master";
import {
  listRateCardGroups,
  listRateCardStoreAssignments,
} from "@/lib/rate-card-groups";
import { canAccessAdminPage } from "@/lib/role-permissions";
import { getCurrentUser } from "@/lib/session";
import { getTariffSheet } from "@/lib/tariffs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!(await canAccessAdminPage(user, "orders"))) {
    return NextResponse.json(
      { message: "You do not have access to orders." },
      { status: 403 },
    );
  }

  try {
    const [categories, allTariffs, customers, assignments] = await Promise.all([
      listItemCategories(false),
      listRateCardGroups(false),
      listCustomers(user.role === "store_manager" ? user.storeId : null),
      listRateCardStoreAssignments(),
    ]);
    const assignedTariffId = user.role === "store_manager"
      ? assignments.find((assignment) => assignment.storeId === user.storeId)?.groupId ?? null
      : null;
    const tariffs = user.role === "store_manager"
      ? allTariffs.filter((tariff) => tariff.id === assignedTariffId)
      : allTariffs;
    const url = new URL(request.url);
    const requestedTariff = url.searchParams.get("tariffId");
    const requestedCategory = url.searchParams.get("categoryId");
    const tariffId = requestedTariff === null
      ? tariffs[0]?.id ?? null
      : Number(requestedTariff);
    const categoryId = requestedCategory === null
      ? categories[0]?.id ?? null
      : Number(requestedCategory);

    if (
      (tariffId !== null && (!Number.isInteger(tariffId) || tariffId < 1)) ||
      (categoryId !== null && (!Number.isInteger(categoryId) || categoryId < 1))
    ) {
      return NextResponse.json(
        { message: "Choose a valid tariff and category." },
        { status: 400 },
      );
    }
    if (tariffId !== null && !tariffs.some((tariff) => tariff.id === tariffId)) {
      return NextResponse.json({ message: "Tariff not found." }, { status: 404 });
    }
    if (categoryId !== null && !categories.some((category) => category.id === categoryId)) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    const sheet = tariffId !== null && categoryId !== null
      ? await getTariffSheet(tariffId, categoryId)
      : null;

    return NextResponse.json(
      {
        categories,
        tariffs,
        customers: customers.filter((customer) => customer.status === "active"),
        tariffId,
        categoryId,
        sheet,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Load booking data failed", error);
    return NextResponse.json(
      { message: "Unable to load booking items." },
      { status: 500 },
    );
  }
}

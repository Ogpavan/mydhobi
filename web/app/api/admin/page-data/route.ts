import { NextResponse } from "next/server";

import { getAdminOrder, getAdminOrderStats, listAdminOrders } from "@/lib/admin-orders";
import { listCustomers } from "@/lib/customers";
import { getDashboardData } from "@/lib/dashboard";
import { getDeliveryStats, listDeliveryRiders, listDeliveryTasks } from "@/lib/deliveries";
import { listInventoryItems } from "@/lib/inventory";
import {
  listSetupInventoryCategories,
  listSetupInventoryUnits,
} from "@/lib/inventory-setup";
import { listSetupCities, listSetupStates } from "@/lib/locations";
import {
  getOperationalReport,
  isOperationalReportKey,
} from "@/lib/operational-reports";
import { listOffers } from "@/lib/offers";
import { getPaymentStats, listPayments } from "@/lib/payments";
import { getPickupStats, listPickupRiders, listPickupTasks } from "@/lib/pickups";
import { listReferrals } from "@/lib/referrals";
import {
  listRolePermissionAssignments,
  permissionGroups,
} from "@/lib/role-permissions";
import { getReportData } from "@/lib/reports";
import { getRider, listRiders } from "@/lib/riders";
import { listSetupRoles } from "@/lib/roles";
import { listCatalogServices } from "@/lib/service-catalog";
import { listItemCategories, listItems, listServices } from "@/lib/item-master";
import { listRateCardGroups, listRateCardStoreAssignments } from "@/lib/rate-card-groups";
import { getCurrentUser } from "@/lib/session";
import { listStoreTeamMembers } from "@/lib/store-team";
import { getStoreById, listStores } from "@/lib/stores";
import { getComplaintStats, listComplaints } from "@/lib/support";
import { getWalletReport } from "@/lib/wallet-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: unknown) {
  return NextResponse.json(
    { data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "store_manager" && !user.storeId) {
    return NextResponse.json({ message: "Store manager is not assigned to a store." }, { status: 403 });
  }
  const storeId = user.role === "store_manager" ? user.storeId : null;

  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const id = url.searchParams.get("id") ?? "";
  if (user.role === "store_manager" &&
      ![
        "dashboard", "orders", "order-detail", "customers", "pickups", "deliveries",
        "inventory", "riders", "rider-detail", "payments", "complaints", "reports",
        "operational-report", "profile",
      ].includes(key)) {
    return NextResponse.json({ message: "This page is not available to a store manager." }, { status: 403 });
  }

  switch (key) {
    case "dashboard":
      return response(await getDashboardData(storeId));
    case "customers":
      return response({
        customers: await listCustomers(storeId),
        canManageWallet: user.role === "admin",
      });
    case "stores":
      return response({ stores: await listStores() });
    case "store-create": {
      const [states, cities] = await Promise.all([
        listSetupStates(),
        listSetupCities(),
      ]);
      const activeStates = states.filter((state) => state.isActive);
      const activeStateIds = new Set(activeStates.map((state) => state.id));
      return response({
        states: activeStates,
        cities: cities.filter(
          (city) => city.isActive && activeStateIds.has(city.stateId),
        ),
      });
    }
    case "store-detail": {
      const store = await getStoreById(id);
      if (!store) {
        return NextResponse.json({ message: "Store not found." }, { status: 404 });
      }
      const [members, roles] = await Promise.all([
        listStoreTeamMembers(id),
        listSetupRoles(),
      ]);
      return response({
        store,
        members,
        roles: roles.filter((role) => role.isActive),
      });
    }
    case "store-edit": {
      const store = await getStoreById(id);
      if (!store) {
        return NextResponse.json({ message: "Store not found." }, { status: 404 });
      }
      return response({ store });
    }
    case "orders": {
      const [orders, stats] = await Promise.all([
        listAdminOrders(storeId),
        getAdminOrderStats(storeId),
      ]);
      return response({ orders, stats });
    }
    case "order-detail": {
      const order = await getAdminOrder(id, storeId);
      if (!order) {
        return NextResponse.json({ message: "Order not found." }, { status: 404 });
      }
      return response({ order });
    }
    case "pickups": {
      const [pickups, riders, stats] = await Promise.all([
        listPickupTasks(storeId),
        listPickupRiders(storeId),
        getPickupStats(storeId),
      ]);
      return response({ pickups, riders, stats });
    }
    case "deliveries": {
      const [deliveries, riders, stats] = await Promise.all([
        listDeliveryTasks(storeId),
        listDeliveryRiders(storeId),
        getDeliveryStats(storeId),
      ]);
      return response({ deliveries, riders, stats });
    }
    case "services": {
      const [categories, items, services, stores] = await Promise.all([
        listItemCategories(true), listItems({ includeInactive: true }), listServices(true), listStores(),
      ]);
      return response({ categories, items, services, stores });
    }
    case "service-categories":
      return response({ categories: await listItemCategories(true) });
    case "service-pricing": {
      return response({ services: await listServices(true) });
    }
    case "rate-card": {
      const [categories, groups, services, stores, assignments] = await Promise.all([
        listItemCategories(true),
        listRateCardGroups(true),
        listServices(true),
        listStores(),
        listRateCardStoreAssignments(),
      ]);
      return response({ categories, groups, services, stores, assignments });
    }
    case "inventory": {
      const [items, categories, units] = await Promise.all([
        listInventoryItems(storeId),
        listSetupInventoryCategories(),
        listSetupInventoryUnits(),
      ]);
      const activeUnits = units.filter((unit) => unit.isActive);
      const activeUnitIds = new Set(activeUnits.map((unit) => unit.id));
      return response({
        items,
        categories: categories.filter(
          (category) =>
            category.isActive && activeUnitIds.has(category.unitTypeId),
        ),
        units: activeUnits,
      });
    }
    case "riders":
      return response({ riders: await listRiders(storeId) });
    case "rider-detail": {
      const rider = await getRider(id, storeId);
      if (!rider) {
        return NextResponse.json({ message: "Rider not found." }, { status: 404 });
      }
      return response({ rider });
    }
    case "payments": {
      const [payments, stats] = await Promise.all([
        listPayments(storeId),
        getPaymentStats(storeId),
      ]);
      return response({ payments, stats });
    }
    case "offers":
      return response({ offers: await listOffers() });
    case "referrals":
      return response({ referrals: await listReferrals() });
    case "complaints": {
      const [complaints, stats] = await Promise.all([
        listComplaints(storeId),
        getComplaintStats(storeId),
      ]);
      return response({ complaints, stats });
    }
    case "reports":
      return response({ report: await getReportData(30, storeId) });
    case "operational-report": {
      const report = url.searchParams.get("report") ?? "";
      if (!isOperationalReportKey(report)) {
        return NextResponse.json({ message: "Report not found." }, { status: 404 });
      }
      return response({ report: await getOperationalReport(report, 30, storeId) });
    }
    case "wallet-report":
      if (user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
      return response({ report: await getWalletReport() });
    case "basic-setup": {
      const [states, cities, roles, inventoryCategories, inventoryUnits] =
        await Promise.all([
          listSetupStates(),
          listSetupCities(),
          listSetupRoles(),
          listSetupInventoryCategories(),
          listSetupInventoryUnits(),
        ]);
      return response({
        states,
        cities,
        roles,
        inventoryCategories,
        inventoryUnits,
      });
    }
    case "profile":
      return response({ user });
    case "role-permissions":
      if (user.role !== "admin") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
      return response({
        roles: await listSetupRoles(),
        groups: permissionGroups,
        assignments: await listRolePermissionAssignments(),
      });
    case "search": {
      const [orders, customers, riders, services] = await Promise.all([
        listAdminOrders(),
        listCustomers(),
        listRiders(),
        listCatalogServices(),
      ]);
      return response({ orders, customers, riders, services });
    }
    default:
      return NextResponse.json({ message: "Page not found." }, { status: 404 });
  }
}

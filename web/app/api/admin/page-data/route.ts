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
import { listCatalogServices, listServiceCategories } from "@/lib/service-catalog";
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

  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const id = url.searchParams.get("id") ?? "";

  switch (key) {
    case "dashboard":
      return response(await getDashboardData());
    case "customers":
      return response({
        customers: await listCustomers(),
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
        listAdminOrders(),
        getAdminOrderStats(),
      ]);
      return response({ orders, stats });
    }
    case "order-detail": {
      const order = await getAdminOrder(id);
      if (!order) {
        return NextResponse.json({ message: "Order not found." }, { status: 404 });
      }
      return response({ order });
    }
    case "pickups": {
      const [pickups, riders, stats] = await Promise.all([
        listPickupTasks(),
        listPickupRiders(),
        getPickupStats(),
      ]);
      return response({ pickups, riders, stats });
    }
    case "deliveries": {
      const [deliveries, riders, stats] = await Promise.all([
        listDeliveryTasks(),
        listDeliveryRiders(),
        getDeliveryStats(),
      ]);
      return response({ deliveries, riders, stats });
    }
    case "services": {
      const [categories, services] = await Promise.all([
        listServiceCategories(true),
        listCatalogServices(true),
      ]);
      return response({ categories, services });
    }
    case "service-categories":
      return response({ categories: await listServiceCategories(true) });
    case "service-pricing":
      return response({ services: await listCatalogServices(true) });
    case "inventory": {
      const [items, categories, units] = await Promise.all([
        listInventoryItems(),
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
      return response({ riders: await listRiders() });
    case "rider-detail": {
      const rider = await getRider(id);
      if (!rider) {
        return NextResponse.json({ message: "Rider not found." }, { status: 404 });
      }
      return response({ rider });
    }
    case "payments": {
      const [payments, stats] = await Promise.all([
        listPayments(),
        getPaymentStats(),
      ]);
      return response({ payments, stats });
    }
    case "offers":
      return response({ offers: await listOffers() });
    case "referrals":
      return response({ referrals: await listReferrals() });
    case "complaints": {
      const [complaints, stats] = await Promise.all([
        listComplaints(),
        getComplaintStats(),
      ]);
      return response({ complaints, stats });
    }
    case "reports":
      return response({ report: await getReportData(30) });
    case "operational-report": {
      const report = url.searchParams.get("report") ?? "";
      if (!isOperationalReportKey(report)) {
        return NextResponse.json({ message: "Report not found." }, { status: 404 });
      }
      return response({ report: await getOperationalReport(report, 30) });
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

import { HttpResponse } from "@/server/http-response";

import {
  getAdminOrder,
  getAdminOrderStats,
  listAdminOrders,
} from "@/lib/admin-orders";
import { listCustomers } from "@/lib/customers";
import { getDashboardData } from "@/lib/dashboard";
import {
  getDeliveryStats,
  listDeliveryRiders,
  listDeliveryTasks,
} from "@/lib/deliveries";
import { listInventoryItems } from "@/lib/inventory";
import { getDiscountGroup, listDiscountGroups } from "@/lib/discount-groups";
import {
  listSetupInventoryCategories,
  listSetupInventoryUnits,
} from "@/lib/inventory-setup";
import { listItemCategories, listItems, listServices } from "@/lib/item-master";
import { listOrderCharges } from "@/lib/order-charges";
import { listSetupCities, listSetupStates } from "@/lib/locations";
import { listOffers } from "@/lib/offers";
import {
  getOperationalReport,
  isOperationalReportKey,
} from "@/lib/operational-reports";
import { getPaymentStats, listPayments } from "@/lib/payments";
import {
  getPickupStats,
  listPickupRiders,
  listPickupTasks,
} from "@/lib/pickups";
import {
  listRateCardGroups,
  listRateCardStoreAssignments,
} from "@/lib/rate-card-groups";
import { listReferrals } from "@/lib/referrals";
import { getReportData } from "@/lib/reports";
import { getRider, listRiders } from "@/lib/riders";
import {
  canAccessAdminPage,
  listRolePermissionAssignments,
  permissionGroups,
} from "@/lib/role-permissions";
import { listSetupRoles } from "@/lib/roles";
import { listCatalogServices } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";
import { listStoreTeamMembers } from "@/lib/store-team";
import { getStoreById, getStoreDiscountPolicy, listStores } from "@/lib/stores";
import { getComplaintStats, listComplaints } from "@/lib/support";
import { getWalletReport } from "@/lib/wallet-report";

function response(data: unknown) {
  return HttpResponse.json(
    { data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (user.role === "store_manager" && !user.storeId) {
    return HttpResponse.json(
      { message: "Store manager is not assigned to a store." },
      { status: 403 },
    );
  }
  const storeId = user.role === "store_manager" ? user.storeId : null;

  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const id = url.searchParams.get("id") ?? "";
  const permissionKeyByPage: Record<string, string> = {
    dashboard: "dashboard",
    orders: "orders",
    "order-detail": "orders",
    customers: "customers",
    pickups: "pickups",
    deliveries: "deliveries",
    inventory: "inventory",
    riders: "riders",
    "rider-detail": "riders",
    payments: "payments",
    offers: "offers",
    complaints: "complaints",
    reports: "reports",
    "operational-report": "reports",
  };
  const permissionKey = permissionKeyByPage[key];
  if (permissionKey && !(await canAccessAdminPage(user, permissionKey))) {
    return HttpResponse.json(
      { message: "You do not have access to this page." },
      { status: 403 },
    );
  }
  if (
    user.role === "store_manager" &&
    ![
      "dashboard",
      "orders",
      "order-detail",
      "customers",
      "pickups",
      "deliveries",
      "inventory",
      "riders",
      "rider-detail",
      "payments",
      "complaints",
      "reports",
      "operational-report",
      "offers",
      "profile",
    ].includes(key)
  ) {
    return HttpResponse.json(
      { message: "This page is not available to a store manager." },
      { status: 403 },
    );
  }

  if (key.startsWith("discount-group") && user.role !== "admin") {
    return HttpResponse.json(
      { message: "Admin access is required." },
      { status: 403 },
    );
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
    case "discount-groups":
      return response({ groups: await listDiscountGroups(true) });
    case "discount-group-create":
      return response({ services: await listServices(true) });
    case "discount-group-edit":
    case "discount-group-detail": {
      const groupId = Number(id);
      if (!Number.isInteger(groupId) || groupId < 1) {
        return HttpResponse.json(
          { message: "Discount group not found." },
          { status: 404 },
        );
      }
      const group = await getDiscountGroup(groupId);
      if (!group) {
        return HttpResponse.json(
          { message: "Discount group not found." },
          { status: 404 },
        );
      }
      return response({
        group,
        services: await listServices(true),
      });
    }
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
        canManageDiscountPolicy: user.role === "admin",
        discountGroups:
          user.role === "admin" ? await listDiscountGroups(false) : [],
      });
    }
    case "store-detail": {
      const store = await getStoreById(id);
      if (!store) {
        return HttpResponse.json(
          { message: "Store not found." },
          { status: 404 },
        );
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
        return HttpResponse.json(
          { message: "Store not found." },
          { status: 404 },
        );
      }
      return response({
        store,
        canManageDiscountPolicy: user.role === "admin",
        discountGroups:
          user.role === "admin" ? await listDiscountGroups(false) : [],
      });
    }
    case "orders": {
      const [orders, stats, stores] = await Promise.all([
        listAdminOrders(storeId),
        getAdminOrderStats(storeId),
        user.role === "admin" ? listStores() : Promise.resolve([]),
      ]);
      return response({
        orders,
        stats,
        stores: stores.map((store) => ({ id: store.id, name: store.name })),
      });
    }
    case "order-detail": {
      const order = await getAdminOrder(id, storeId);
      if (!order) {
        return HttpResponse.json(
          { message: "Order not found." },
          { status: 404 },
        );
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
        listItemCategories(true),
        listItems({ includeInactive: true }),
        listServices(true),
        listStores(),
      ]);
      return response({ categories, items, services, stores });
    }
    case "service-categories":
      return response({ categories: await listItemCategories(true) });
    case "service-pricing": {
      return response({ services: await listServices(true) });
    }
    case "service-mapping": {
      return response({ categories: await listItemCategories(false) });
    }
    case "rate-card": {
      const [categories, stores, groups, assignments] = await Promise.all([
        listItemCategories(false),
        listStores(),
        listRateCardGroups(true),
        listRateCardStoreAssignments(),
      ]);
      return response({ categories, stores, groups, assignments });
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
        return HttpResponse.json(
          { message: "Rider not found." },
          { status: 404 },
        );
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
    case "offers": {
      if (user.role === "store_manager" && user.storeId) {
        return response({
          offers: await listOffers(false, user.storeId),
          policy: await getStoreDiscountPolicy(user.storeId),
          storeManager: true,
        });
      }
      return response({
        offers: await listOffers(),
        policy: null,
        storeManager: false,
      });
    }
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
        return HttpResponse.json(
          { message: "Report not found." },
          { status: 404 },
        );
      }
      return response({
        report: await getOperationalReport(report, 30, storeId),
      });
    }
    case "wallet-report":
      if (user.role !== "admin") {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 403 });
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
    case "charge-master":
      if (user.role !== "admin") {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 403 });
      }
      return response({ charges: await listOrderCharges(true) });
    case "profile":
      return response({ user });
    case "role-permissions":
      if (user.role !== "admin") {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 403 });
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
      return HttpResponse.json({ message: "Page not found." }, { status: 404 });
  }
}

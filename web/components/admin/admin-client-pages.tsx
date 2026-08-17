"use client";

import { useParams } from "next/navigation";

import { AdminProfileForm } from "@/components/admin/admin-profile-form";
import { AdminComplaints } from "@/components/admin/complaints-admin";
import { CustomersView } from "@/components/admin/customers-view";
import { AdminDeliveries } from "@/components/admin/deliveries-admin";
import { InventoryView } from "@/components/admin/inventory-view";
import { LocationSetup } from "@/components/admin/location-setup";
import { AdminOffers } from "@/components/admin/offers-admin";
import { OperationalReportView } from "@/components/admin/operational-report-view";
import { AdminOrderDetails, AdminOrdersList } from "@/components/admin/orders-admin";
import { AdminPageError, AdminPageLoading } from "@/components/admin/admin-page-state";
import { AdminPayments } from "@/components/admin/payments-admin";
import { AdminPickups } from "@/components/admin/pickups-admin";
import { AdminReferrals } from "@/components/admin/referrals-admin";
import { AdminReports } from "@/components/admin/reports-admin";
import { AdminRiderDetails, AdminRiders } from "@/components/admin/riders-admin";
import { RolePermissionsAdmin } from "@/components/admin/role-permissions-admin";
import {
  CatalogServicesAdmin,
  ServiceCategoriesAdmin,
  ServicePricingAdmin,
} from "@/components/admin/service-catalog-admin";
import { StoreDetailView } from "@/components/admin/store-detail-view";
import { StoreForm } from "@/components/admin/store-form";
import { WalletReportView } from "@/components/admin/wallet-report-view";
import { useAdminPageData } from "@/components/admin/admin-client-data";
import type { AdminOrder, AdminOrderStats, AdminOrderSummary } from "@/lib/admin-orders";
import type { AuthUser } from "@/lib/auth";
import type { Customer } from "@/lib/customers";
import type { DeliveryStats, DeliveryTask } from "@/lib/deliveries";
import type { InventoryItem } from "@/lib/inventory";
import type {
  SetupInventoryCategory,
  SetupInventoryUnit,
} from "@/lib/inventory-setup";
import type { SetupCity, SetupState } from "@/lib/locations";
import type { OperationalReportData } from "@/lib/operational-reports";
import type { Offer } from "@/lib/offers";
import type { PaymentRecord, PaymentStats } from "@/lib/payments";
import type { PickupRider, PickupStats, PickupTask } from "@/lib/pickups";
import type { ReferralRecord } from "@/lib/referrals";
import type { PermissionGroup } from "@/lib/role-permissions";
import type { ReportData } from "@/lib/reports";
import type { RiderDetails, RiderRecord } from "@/lib/riders";
import type { SetupRole } from "@/lib/roles";
import type { CatalogService, ServiceCategory } from "@/lib/service-catalog";
import type { StoreTeamMember } from "@/lib/store-team";
import type { Store } from "@/lib/stores";
import type { ComplaintRecord, ComplaintStats } from "@/lib/support";
import type { WalletReportData } from "@/lib/wallet-report";

function PageState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  if (loading) return <AdminPageLoading />;
  if (error) return <AdminPageError message={error} retry={retry} />;
  return null;
}

export function AdminCustomersClient() {
  const result = useAdminPageData<{
    customers: Customer[];
    canManageWallet: boolean;
  }>("key=customers");
  if (!result.data) return <PageState {...result} />;
  return (
    <CustomersView
      initialCustomers={result.data.customers}
      canManageWallet={result.data.canManageWallet}
    />
  );
}

export function AdminOrdersClient() {
  const result = useAdminPageData<{
    orders: AdminOrderSummary[];
    stats: AdminOrderStats;
  }>("key=orders");
  if (!result.data) return <PageState {...result} />;
  return <AdminOrdersList initialOrders={result.data.orders} stats={result.data.stats} />;
}

export function AdminOrderDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{ order: AdminOrder }>(
    `key=order-detail&id=${encodeURIComponent(id)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <AdminOrderDetails initialOrder={result.data.order} />;
}

export function AdminPickupsClient() {
  const result = useAdminPageData<{
    pickups: PickupTask[];
    riders: PickupRider[];
    stats: PickupStats;
  }>("key=pickups");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminPickups
      initialPickups={result.data.pickups}
      riders={result.data.riders}
      stats={result.data.stats}
    />
  );
}

export function AdminDeliveriesClient() {
  const result = useAdminPageData<{
    deliveries: DeliveryTask[];
    riders: PickupRider[];
    stats: DeliveryStats;
  }>("key=deliveries");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminDeliveries
      initialDeliveries={result.data.deliveries}
      riders={result.data.riders}
      stats={result.data.stats}
    />
  );
}

export function AdminServicesClient() {
  const result = useAdminPageData<{
    categories: ServiceCategory[];
    services: CatalogService[];
  }>("key=services", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <CatalogServicesAdmin
      initialCategories={result.data.categories}
      initialServices={result.data.services}
    />
  );
}

export function AdminServiceCategoriesClient() {
  const result = useAdminPageData<{ categories: ServiceCategory[] }>(
    "key=service-categories",
    60_000,
  );
  if (!result.data) return <PageState {...result} />;
  return <ServiceCategoriesAdmin initialCategories={result.data.categories} />;
}

export function AdminServicePricingClient() {
  const result = useAdminPageData<{ categories: ServiceCategory[]; services: CatalogService[] }>(
    "key=service-pricing",
    60_000,
  );
  if (!result.data) return <PageState {...result} />;
  return <ServicePricingAdmin initialCategories={result.data.categories} initialServices={result.data.services} />;
}

export function AdminInventoryClient() {
  const result = useAdminPageData<{
    items: InventoryItem[];
    categories: SetupInventoryCategory[];
    units: SetupInventoryUnit[];
  }>("key=inventory");
  if (!result.data) return <PageState {...result} />;
  return (
    <InventoryView
      initialItems={result.data.items}
      categories={result.data.categories}
      units={result.data.units}
    />
  );
}

export function AdminRidersClient() {
  const result = useAdminPageData<{ riders: RiderRecord[] }>("key=riders");
  if (!result.data) return <PageState {...result} />;
  return <AdminRiders initialRiders={result.data.riders} />;
}

export function AdminRiderDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{ rider: RiderDetails }>(
    `key=rider-detail&id=${encodeURIComponent(id)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <AdminRiderDetails initialRider={result.data.rider} />;
}

export function AdminPaymentsClient() {
  const result = useAdminPageData<{
    payments: PaymentRecord[];
    stats: PaymentStats;
  }>("key=payments");
  if (!result.data) return <PageState {...result} />;
  return <AdminPayments initialPayments={result.data.payments} stats={result.data.stats} />;
}

export function AdminOffersClient() {
  const result = useAdminPageData<{ offers: Offer[] }>("key=offers");
  if (!result.data) return <PageState {...result} />;
  return <AdminOffers initialOffers={result.data.offers} />;
}

export function AdminReferralsClient() {
  const result = useAdminPageData<{ referrals: ReferralRecord[] }>("key=referrals");
  if (!result.data) return <PageState {...result} />;
  return <AdminReferrals referrals={result.data.referrals} />;
}

export function AdminComplaintsClient() {
  const result = useAdminPageData<{
    complaints: ComplaintRecord[];
    stats: ComplaintStats;
  }>("key=complaints");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminComplaints
      initialComplaints={result.data.complaints}
      initialStats={result.data.stats}
    />
  );
}

export function AdminReportsClient() {
  const result = useAdminPageData<{ report: ReportData }>("key=reports");
  if (!result.data) return <PageState {...result} />;
  return <AdminReports initialReport={result.data.report} />;
}

export function AdminOperationalReportClient() {
  const { report } = useParams<{ report: string }>();
  const result = useAdminPageData<{ report: OperationalReportData }>(
    `key=operational-report&report=${encodeURIComponent(report)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <OperationalReportView initialReport={result.data.report} />;
}

export function AdminWalletReportClient() {
  const result = useAdminPageData<{ report: WalletReportData }>("key=wallet-report");
  if (!result.data) return <PageState {...result} />;
  return <WalletReportView report={result.data.report} />;
}

export function AdminBasicSetupClient() {
  const result = useAdminPageData<{
    states: SetupState[];
    cities: SetupCity[];
    roles: SetupRole[];
    inventoryCategories: SetupInventoryCategory[];
    inventoryUnits: SetupInventoryUnit[];
  }>("key=basic-setup", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <LocationSetup
      initialStates={result.data.states}
      initialCities={result.data.cities}
      initialRoles={result.data.roles}
      initialInventoryCategories={result.data.inventoryCategories}
      initialInventoryUnits={result.data.inventoryUnits}
    />
  );
}

export function AdminProfileClient() {
  const result = useAdminPageData<{ user: AuthUser }>("key=profile", 60_000);
  if (!result.data) return <PageState {...result} />;
  return <AdminProfileForm user={result.data.user} />;
}

export function AdminRolePermissionsClient() {
  const result = useAdminPageData<{
    roles: SetupRole[];
    groups: PermissionGroup[];
    assignments: Record<string, string[]>;
  }>("key=role-permissions", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <RolePermissionsAdmin
      roles={result.data.roles}
      groups={result.data.groups}
      initialAssignments={result.data.assignments}
    />
  );
}

export function AdminStoreCreateClient() {
  const result = useAdminPageData<{
    states: SetupState[];
    cities: SetupCity[];
  }>("key=store-create", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <StoreForm
      mode="create"
      locationStates={result.data.states}
      locationCities={result.data.cities}
    />
  );
}

export function AdminStoreEditClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{ store: Store }>(
    `key=store-edit&id=${encodeURIComponent(id)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <StoreForm mode="edit" store={result.data.store} />;
}

export function AdminStoreDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{
    store: Store;
    members: StoreTeamMember[];
    roles: SetupRole[];
  }>(`key=store-detail&id=${encodeURIComponent(id)}`);
  if (!result.data) return <PageState {...result} />;
  return (
    <StoreDetailView
      store={result.data.store}
      members={result.data.members}
      roles={result.data.roles}
    />
  );
}

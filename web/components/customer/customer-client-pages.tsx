"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

import { AddressesView, AddAddressView, OrderSuccessView, PaymentView, ServiceDetailsView } from "@/components/customer/checkout-flow-views";
import { CustomerDashboard } from "@/components/customer/customer-dashboard";
import { useCustomerData } from "@/components/customer/customer-client-data";
import { CustomerPageError, CustomerPageSkeleton } from "@/components/customer/customer-page-state";
import { MyOrdersView } from "@/components/customer/my-orders-view";
import { OrderDetailsView } from "@/components/customer/order-details-view";
import { ProfileView } from "@/components/customer/profile-view";
import { SchedulePickupView, type PickupDateOption } from "@/components/customer/schedule-pickup-view";
import { ServicesListView } from "@/components/customer/services-list-view";
import { TrackOrderView } from "@/components/customer/track-order-view";
import { WalletView } from "@/components/customer/wallet-view";
import type { AuthUser } from "@/lib/auth";
import type { CustomerOrder } from "@/lib/customer-orders";
import type { PortalAddress, PortalOrder } from "@/lib/customer-portal";
import type { Offer } from "@/lib/offers";
import type { CatalogService, ServiceCategory } from "@/lib/service-catalog";

type UserResponse = { user: AuthUser };
type CatalogResponse = {
  categories: ServiceCategory[];
  services: CatalogService[];
  offers: Offer[];
};
type AddressesResponse = { addresses: PortalAddress[] };
type OrdersResponse = { orders: PortalOrder[] };
type WalletResponse = {
  wallet: {
    balance: number;
    transactions: Array<{
      id: string;
      label: string;
      amount: number;
      createdAt: string;
    }>;
  };
};
type NotificationsResponse = { notifications: Array<{ is_read: boolean }> };

export function CustomerHomeClient() {
  const home = useCustomerData<{
    user: AuthUser;
    wallet: WalletResponse["wallet"];
    categories: ServiceCategory[];
    addresses: PortalAddress[];
    notifications: NotificationsResponse["notifications"];
    offers: Offer[];
  }>("/api/customer/home", 30_000);

  if (home.loading) return <CustomerPageSkeleton variant="dashboard" rows={5} />;
  if (home.error) return <CustomerPageError message={home.error} retry={home.retry} />;
  if (!home.data) return <CustomerPageSkeleton variant="dashboard" rows={5} />;

  const address = home.data.addresses.find((item) => item.isDefault) ?? home.data.addresses[0];
  return (
    <CustomerDashboard
      user={home.data.user}
      walletBalance={home.data.wallet.balance}
      categories={home.data.categories}
      location={address ? `${address.city} - ${address.pincode}` : "Add pickup address"}
      unreadNotifications={home.data.notifications.filter((item) => !item.is_read).length}
      offer={home.data.offers[0] ?? null}
    />
  );
}

export function CustomerServicesClient() {
  const catalog = useCustomerData<CatalogResponse>("/api/customer/catalog", 300_000);
  if (catalog.loading) return <CustomerPageSkeleton variant="services" rows={5} />;
  if (catalog.error) return <CustomerPageError message={catalog.error} retry={catalog.retry} />;
  if (!catalog.data) return <CustomerPageSkeleton variant="services" rows={5} />;
  return <ServicesListView categories={catalog.data.categories} services={catalog.data.services} offer={catalog.data.offers[0] ?? null} />;
}

export function CustomerServiceDetailsClient() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const catalog = useCustomerData<CatalogResponse>("/api/customer/catalog", 300_000);
  const service = catalog.data?.services.find((item) => item.slug === params.slug);

  useEffect(() => {
    if (!catalog.loading && catalog.data && !service) router.replace("/customer/services");
  }, [catalog.data, catalog.loading, router, service]);

  if (catalog.loading || (!service && !catalog.error)) return <CustomerPageSkeleton variant="detail" rows={4} />;
  if (catalog.error) return <CustomerPageError message={catalog.error} retry={catalog.retry} />;
  return service ? <ServiceDetailsView service={service} /> : null;
}

export function CustomerOrdersClient() {
  const orders = useCustomerData<OrdersResponse>("/api/customer/orders", 15_000);
  if (orders.loading) return <CustomerPageSkeleton variant="list" rows={5} />;
  if (orders.error) return <CustomerPageError message={orders.error} retry={orders.retry} />;
  const display: CustomerOrder[] = (orders.data?.orders ?? []).map((order) => ({
    id: order.id,
    placedAt: new Date(order.createdAt).toLocaleString("en-IN"),
    shortDate: new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    service: order.service,
    itemCount: order.itemCount,
    amount: order.amount,
    status: order.status === "Delivered" ? "Delivered" : order.status === "Cancelled" ? "Cancelled" : order.status === "Out for Delivery" ? "Out for Delivery" : "In Progress",
    pickup: new Date(order.pickupAt).toLocaleString("en-IN"),
    delivery: order.deliveryAt ? new Date(order.deliveryAt).toLocaleString("en-IN") : "To be updated",
    paid: order.paymentStatus === "Paid",
  }));
  return <MyOrdersView orders={display} />;
}

export function CustomerOrderDetailsClient() {
  const params = useParams<{ id: string }>();
  const order = useCustomerData<{ order: PortalOrder }>(`/api/customer/orders/${encodeURIComponent(params.id)}`, 15_000);
  if (order.loading) return <CustomerPageSkeleton variant="detail" rows={5} />;
  if (order.error) return <CustomerPageError message={order.error} retry={order.retry} />;
  return order.data ? <OrderDetailsView order={order.data.order} /> : <CustomerPageSkeleton variant="detail" />;
}

export function CustomerWalletClient() {
  const wallet = useCustomerData<WalletResponse>("/api/customer/wallet", 15_000);
  if (wallet.loading) return <CustomerPageSkeleton variant="list" rows={5} />;
  if (wallet.error) return <CustomerPageError message={wallet.error} retry={wallet.retry} />;
  return wallet.data ? <WalletView balance={wallet.data.wallet.balance} portalTransactions={wallet.data.wallet.transactions} /> : <CustomerPageSkeleton variant="list" />;
}

export function CustomerProfileClient() {
  const user = useCustomerData<UserResponse>("/api/auth/me", 60_000);
  if (user.loading) return <CustomerPageSkeleton variant="form" rows={6} />;
  if (user.error) return <CustomerPageError message={user.error} retry={user.retry} />;
  return user.data ? <ProfileView user={user.data.user} /> : <CustomerPageSkeleton variant="form" />;
}

export function CustomerAddressesClient() {
  const addresses = useCustomerData<AddressesResponse>("/api/customer/addresses", 15_000);
  if (addresses.loading) return <CustomerPageSkeleton variant="list" rows={4} />;
  if (addresses.error) return <CustomerPageError message={addresses.error} retry={addresses.retry} />;
  return <AddressesView addresses={addresses.data?.addresses ?? []} />;
}

export function CustomerEditAddressClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const addresses = useCustomerData<AddressesResponse>("/api/customer/addresses", 15_000);
  const address = addresses.data?.addresses.find((item) => item.id === params.id);
  useEffect(() => {
    if (!addresses.loading && addresses.data && !address) router.replace("/customer/addresses");
  }, [address, addresses.data, addresses.loading, router]);
  if (addresses.loading || (!address && !addresses.error)) return <CustomerPageSkeleton variant="form" rows={4} />;
  if (addresses.error) return <CustomerPageError message={addresses.error} retry={addresses.retry} />;
  return address ? <AddAddressView address={address} /> : null;
}

export function CustomerPaymentClient() {
  const wallet = useCustomerData<WalletResponse>("/api/customer/wallet", 15_000);
  if (wallet.loading) return <CustomerPageSkeleton variant="form" rows={4} />;
  if (wallet.error) return <CustomerPageError message={wallet.error} retry={wallet.retry} />;
  return <PaymentView walletBalance={wallet.data?.wallet.balance ?? 0} />;
}

function pickupDates(): PickupDateOption[] {
  const start = new Date();
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      id: date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }),
      day: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Kolkata" }),
      date: date.toLocaleDateString("en-US", { day: "numeric", timeZone: "Asia/Kolkata" }),
      month: date.toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Kolkata" }),
    };
  });
}

export function CustomerScheduleClient() {
  const addresses = useCustomerData<AddressesResponse>("/api/customer/addresses", 15_000);
  const dates = useMemo(pickupDates, []);
  if (addresses.loading) return <CustomerPageSkeleton variant="form" rows={4} />;
  if (addresses.error) return <CustomerPageError message={addresses.error} retry={addresses.retry} />;
  const address = addresses.data?.addresses[0];
  const pickupAddress = address ? [address.fullAddress, address.landmark, address.city, address.pincode].filter(Boolean).join(", ") : "";
  return <SchedulePickupView dates={dates} pickupAddress={pickupAddress} />;
}

export function CustomerTrackClient() {
  const orders = useCustomerData<OrdersResponse>("/api/customer/orders", 15_000);
  if (orders.loading) return <CustomerPageSkeleton variant="list" rows={5} />;
  if (orders.error) return <CustomerPageError message={orders.error} retry={orders.retry} />;
  return <TrackOrderView order={orders.data?.orders[0] ?? null} />;
}

export function CustomerOrderSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("order") ?? "";
  const order = useCustomerData<{ order: PortalOrder }>(`/api/customer/orders/${encodeURIComponent(id)}`, 60_000);
  useEffect(() => {
    if (!id) router.replace("/customer/orders");
  }, [id, router]);
  if (!id || order.loading) return <CustomerPageSkeleton variant="detail" rows={3} />;
  if (order.error) return <CustomerPageError message={order.error} retry={order.retry} />;
  return order.data ? <OrderSuccessView order={order.data.order} /> : <CustomerPageSkeleton variant="detail" rows={3} />;
}

import { useCustomerData } from "@/components/customer/customer-client-data";
import { CustomerDashboard } from "@/components/customer/customer-dashboard";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import type { AuthUser } from "@/lib/auth";
import type { PortalAddress, PortalOrder } from "@/lib/customer-portal";
import type { Offer } from "@/lib/offers";
import type { OrderingCatalog } from "@/lib/customer-ordering";
type NotificationsResponse = { notifications: Array<{ is_read: boolean }> };
export function CustomerHomeClient() {
  const home = useCustomerData<{
    user: AuthUser;
    addresses: PortalAddress[];
    notifications: NotificationsResponse["notifications"];
    offers: Offer[];
  }>("/api/customer/home", 30_000);
  const orders = useCustomerData<{ orders: PortalOrder[] }>(
    "/api/customer/orders",
    15_000,
  );
  const catalog = useCustomerData<OrderingCatalog>(
    "/api/customer/catalog",
    300_000,
  );

  if (home.loading)
    return <CustomerPageSkeleton variant="dashboard" rows={5} />;
  if (home.error)
    return <CustomerPageError message={home.error} retry={home.retry} />;
  if (!home.data) return <CustomerPageSkeleton variant="dashboard" rows={5} />;

  const address =
    home.data.addresses.find((item) => item.isDefault) ??
    home.data.addresses[0];
  const upcomingOrder =
    orders.data?.orders.find(
      (order) => !["Delivered", "Cancelled"].includes(order.status),
    ) ?? null;
  const recentOrders = (orders.data?.orders ?? [])
    .filter((order) => order.id !== upcomingOrder?.id)
    .slice(0, 3);
  return (
    <CustomerDashboard
      user={home.data.user}
      location={
        address
          ? `${address.fullAddress}, ${address.city} - ${address.pincode}`
          : "Add pickup address"
      }
      pickupAddressId={address?.id ?? ""}
      unreadNotifications={
        home.data.notifications.filter((item) => !item.is_read).length
      }
      offer={home.data.offers[0] ?? null}
      upcomingOrder={upcomingOrder}
      recentOrders={recentOrders}
      storeId={catalog.data?.store?.id ?? ""}
      services={
        catalog.data
          ? [
              ...new Map(
                catalog.data.services
                  .filter((service) => service.isActive)
                  .map((service) => [service.id, service]),
              ).values(),
            ]
          : []
      }
    />
  );
}

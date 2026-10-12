import { useCustomerData } from "@/components/customer/customer-client-data";
import { DeliveryStatusView } from "@/components/customer/delivery-status-view";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import type { PortalOrder } from "@/lib/customer-portal";
type OrdersResponse = { orders: PortalOrder[] };
export function CustomerTrackClient() {
  const orders = useCustomerData<OrdersResponse>(
    "/api/customer/orders",
    15_000,
  );
  if (orders.loading) return <CustomerPageSkeleton variant="list" rows={5} />;
  if (orders.error)
    return <CustomerPageError message={orders.error} retry={orders.retry} />;
  return <DeliveryStatusView orders={orders.data?.orders ?? []} />;
}

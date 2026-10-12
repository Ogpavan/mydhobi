import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { MyOrdersView } from "@/components/customer/my-orders-view";
import type { CustomerOrder } from "@/lib/customer-orders";
import type { PortalOrder } from "@/lib/customer-portal";
type OrdersResponse = { orders: PortalOrder[] };

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function CustomerOrdersClient() {
  const orders = useCustomerData<OrdersResponse>(
    "/api/customer/orders",
    15_000,
  );
  if (orders.loading) return <CustomerPageSkeleton variant="list" rows={5} />;
  if (orders.error)
    return <CustomerPageError message={orders.error} retry={orders.retry} />;
  const display: CustomerOrder[] = (orders.data?.orders ?? []).map((order) => ({
    id: order.id,
    placedAt: new Date(order.createdAt).toLocaleString("en-IN"),
    shortDate: new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    service: order.service,
    itemCount: order.itemCount,
    amount: order.amount,
    invoicePending: order.invoicePending,
    status: order.status === "New" ? "Pickup Scheduled" : order.status,
    pickup: formatOrderDate(order.pickupAt),
    delivery: order.deliveryAt
      ? formatOrderDate(order.deliveryAt)
      : "To be updated",
    paid: order.paymentStatus === "Paid",
  }));
  return <MyOrdersView orders={display} />;
}

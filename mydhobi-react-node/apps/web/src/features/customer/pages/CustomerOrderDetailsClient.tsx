import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { OrderDetailsView } from "@/components/customer/order-details-view";
import type { PortalOrder } from "@/lib/customer-portal";
import { useParams } from "@/platform/navigation";
export function CustomerOrderDetailsClient() {
  const params = useParams<{ id: string }>();
  const order = useCustomerData<{ order: PortalOrder }>(
    `/api/customer/orders/${encodeURIComponent(params.id)}`,
    15_000,
  );
  if (order.loading) return <CustomerPageSkeleton variant="detail" rows={5} />;
  if (order.error)
    return <CustomerPageError message={order.error} retry={order.retry} />;
  return order.data ? (
    <OrderDetailsView order={order.data.order} />
  ) : (
    <CustomerPageSkeleton variant="detail" />
  );
}

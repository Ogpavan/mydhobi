import { OrderSuccessView } from "@/components/customer/checkout-flow-views";
import { useCustomerData } from "@/components/customer/customer-client-data";
import { CustomerPageError } from "@/components/customer/customer-page-state";
import type { PortalOrder } from "@/lib/customer-portal";
import { useRouter, useSearchParams } from "@/platform/navigation";
import { useEffect } from "react";
export function CustomerOrderSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("order") ?? "";
  const order = useCustomerData<{ order: PortalOrder }>(
    `/api/customer/orders/${encodeURIComponent(id)}`,
    60_000,
  );
  useEffect(() => {
    if (!id) router.replace("/customer/orders");
  }, [id, router]);
  if (!id || order.loading) return null;
  if (order.error)
    return <CustomerPageError message={order.error} retry={order.retry} />;
  return order.data ? <OrderSuccessView order={order.data.order} /> : null;
}

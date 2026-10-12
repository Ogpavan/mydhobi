import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminOrderDetails } from "@/components/admin/orders-admin";
import type { AdminOrder } from "@/lib/admin-orders";
import { useParams } from "@/platform/navigation";
export function AdminOrderDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{ order: AdminOrder }>(
    `key=order-detail&id=${encodeURIComponent(id)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <AdminOrderDetails initialOrder={result.data.order} />;
}

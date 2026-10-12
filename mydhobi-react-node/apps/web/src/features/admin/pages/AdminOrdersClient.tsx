import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminOrdersList } from "@/components/admin/orders-admin";
import type {
  AdminOrderStats,
  AdminOrderStore,
  AdminOrderSummary,
} from "@/lib/admin-orders";
export function AdminOrdersClient() {
  const result = useAdminPageData<{
    orders: AdminOrderSummary[];
    stats: AdminOrderStats;
    stores: AdminOrderStore[];
  }>("key=orders", 30000, 30000);
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminOrdersList
      initialOrders={result.data.orders}
      stats={result.data.stats}
      stores={result.data.stores}
    />
  );
}

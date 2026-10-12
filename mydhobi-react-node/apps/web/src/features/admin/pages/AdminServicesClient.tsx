import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { ItemsAdmin } from "@/components/admin/item-master-admin";
import type {
  ItemCategory,
  ItemListRow,
  ItemMasterService,
} from "@/lib/item-master-types";
import type { Store } from "@/lib/stores";
export function AdminServicesClient() {
  const result = useAdminPageData<{
    categories: ItemCategory[];
    items: ItemListRow[];
    services: ItemMasterService[];
    stores: Store[];
  }>("key=services", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <ItemsAdmin
      initialCategories={result.data.categories}
      initialItems={result.data.items}
      initialServices={result.data.services}
      stores={result.data.stores}
    />
  );
}

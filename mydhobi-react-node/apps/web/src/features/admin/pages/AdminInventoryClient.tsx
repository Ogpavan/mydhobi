import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { InventoryView } from "@/components/admin/inventory-view";
import type { InventoryItem } from "@/lib/inventory";
import type {
  SetupInventoryCategory,
  SetupInventoryUnit,
} from "@/lib/inventory-setup";
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

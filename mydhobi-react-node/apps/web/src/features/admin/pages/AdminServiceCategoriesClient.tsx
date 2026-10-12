import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { ItemCategoriesAdmin } from "@/components/admin/item-master-admin";
import type { ItemCategory } from "@/lib/item-master-types";
export function AdminServiceCategoriesClient() {
  const result = useAdminPageData<{ categories: ItemCategory[] }>(
    "key=service-categories",
    60_000,
  );
  if (!result.data) return <PageState {...result} />;
  return <ItemCategoriesAdmin initialCategories={result.data.categories} />;
}

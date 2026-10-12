import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { ServiceMappingAdmin } from "@/components/admin/service-mapping-admin";
import type { ItemCategory } from "@/lib/item-master-types";
export function AdminServiceMappingClient() {
  const result = useAdminPageData<{ categories: ItemCategory[] }>(
    "key=service-mapping",
    60_000,
  );
  if (!result.data) return <PageState {...result} />;
  return <ServiceMappingAdmin initialCategories={result.data.categories} />;
}

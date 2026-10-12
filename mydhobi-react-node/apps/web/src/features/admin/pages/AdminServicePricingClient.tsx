import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { MasterServicesAdmin } from "@/components/admin/item-master-admin";
import type { ItemMasterService } from "@/lib/item-master-types";
export function AdminServicePricingClient() {
  const result = useAdminPageData<{ services: ItemMasterService[] }>(
    "key=service-pricing",
    60_000,
  );
  if (!result.data) return <PageState {...result} />;
  return <MasterServicesAdmin initialServices={result.data.services} />;
}

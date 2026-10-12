import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { DiscountGroupsAdmin } from "@/components/admin/discount-groups-admin";
import type { DiscountGroup } from "@/lib/discount-groups";

export function AdminDiscountGroupsClient() {
  const result = useAdminPageData<{ groups: DiscountGroup[] }>(
    "key=discount-groups",
    30_000,
  );
  if (!result.data) return <PageState {...result} />;
  return <DiscountGroupsAdmin initialGroups={result.data.groups} />;
}

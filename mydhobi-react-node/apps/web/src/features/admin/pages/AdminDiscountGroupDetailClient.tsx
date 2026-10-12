import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { DiscountGroupDetail } from "@/components/admin/discount-group-detail";
import type { DiscountGroupDetails } from "@/lib/discount-groups";
import type { ItemMasterService } from "@/lib/item-master-types";
import { useParams } from "@/platform/navigation";

export function AdminDiscountGroupDetailClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{
    group: DiscountGroupDetails;
    services: ItemMasterService[];
  }>(`key=discount-group-detail&id=${encodeURIComponent(id)}`, 30_000);
  if (!result.data) return <PageState {...result} />;
  return <DiscountGroupDetail group={result.data.group} />;
}

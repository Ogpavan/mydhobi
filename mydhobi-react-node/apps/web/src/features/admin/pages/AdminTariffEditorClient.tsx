import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { TariffManagement } from "@/components/admin/tariff-management";
import type {
  ItemCategory,
  RateCardGroup,
  RateCardStoreAssignment,
} from "@/lib/item-master-types";
import type { Store } from "@/lib/stores";
import { useParams } from "@/platform/navigation";
export function AdminTariffEditorClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{
    categories: ItemCategory[];
    stores: Store[];
    groups: RateCardGroup[];
    assignments: RateCardStoreAssignment[];
  }>("key=rate-card", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <TariffManagement
      initialCategories={result.data.categories}
      initialStores={result.data.stores}
      initialGroups={result.data.groups}
      initialAssignments={result.data.assignments}
      initialGroupId={Number(id)}
    />
  );
}

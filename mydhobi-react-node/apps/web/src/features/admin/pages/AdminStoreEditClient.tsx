import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { StoreForm } from "@/components/admin/store-form";
import type { Store } from "@/lib/stores";
import type { DiscountGroup } from "@/lib/discount-groups";
import { useParams } from "@/platform/navigation";
export function AdminStoreEditClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{
    store: Store;
    canManageDiscountPolicy: boolean;
    discountGroups: DiscountGroup[];
  }>(`key=store-edit&id=${encodeURIComponent(id)}`);
  if (!result.data) return <PageState {...result} />;
  return (
    <StoreForm
      mode="edit"
      store={result.data.store}
      canManageDiscountPolicy={result.data.canManageDiscountPolicy}
      discountGroups={result.data.discountGroups}
    />
  );
}

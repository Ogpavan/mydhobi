import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { StoreForm } from "@/components/admin/store-form";
import type { SetupCity, SetupState } from "@/lib/locations";
import type { DiscountGroup } from "@/lib/discount-groups";
export function AdminStoreCreateClient() {
  const result = useAdminPageData<{
    states: SetupState[];
    cities: SetupCity[];
    canManageDiscountPolicy: boolean;
    discountGroups: DiscountGroup[];
  }>("key=store-create", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <StoreForm
      mode="create"
      locationStates={result.data.states}
      locationCities={result.data.cities}
      canManageDiscountPolicy={result.data.canManageDiscountPolicy}
      discountGroups={result.data.discountGroups}
    />
  );
}

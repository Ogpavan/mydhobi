import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminOffers } from "@/components/admin/offers-admin";
import type { Offer } from "@/lib/offers";
import type { StoreDiscountPolicy } from "@/lib/stores";
export function AdminOffersClient() {
  const result = useAdminPageData<{
    offers: Offer[];
    policy: StoreDiscountPolicy | null;
    storeManager: boolean;
  }>("key=offers");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminOffers
      initialOffers={result.data.offers}
      policy={result.data.policy}
      storeManager={result.data.storeManager}
    />
  );
}

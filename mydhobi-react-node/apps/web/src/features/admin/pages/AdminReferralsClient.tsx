import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminReferrals } from "@/components/admin/referrals-admin";
import type { ReferralRecord } from "@/lib/referrals";
export function AdminReferralsClient() {
  const result = useAdminPageData<{ referrals: ReferralRecord[] }>(
    "key=referrals",
  );
  if (!result.data) return <PageState {...result} />;
  return <AdminReferrals referrals={result.data.referrals} />;
}

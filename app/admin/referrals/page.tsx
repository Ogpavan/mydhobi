import { AdminReferrals } from "@/components/admin/referrals-admin";
import { listReferrals } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export default async function ReferralsPage() {
  return <AdminReferrals referrals={await listReferrals()} />;
}

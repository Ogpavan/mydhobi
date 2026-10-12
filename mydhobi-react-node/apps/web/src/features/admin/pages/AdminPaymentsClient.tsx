import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminPayments } from "@/components/admin/payments-admin";
import type { PaymentRecord, PaymentStats } from "@/lib/payments";
export function AdminPaymentsClient() {
  const result = useAdminPageData<{
    payments: PaymentRecord[];
    stats: PaymentStats;
  }>("key=payments");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminPayments
      initialPayments={result.data.payments}
      stats={result.data.stats}
    />
  );
}

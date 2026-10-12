import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { WalletReportView } from "@/components/admin/wallet-report-view";
import type { WalletReportData } from "@/lib/wallet-report";
export function AdminWalletReportClient() {
  const result = useAdminPageData<{ report: WalletReportData }>(
    "key=wallet-report",
  );
  if (!result.data) return <PageState {...result} />;
  return <WalletReportView report={result.data.report} />;
}

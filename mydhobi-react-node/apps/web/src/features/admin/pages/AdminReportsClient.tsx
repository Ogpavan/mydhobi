import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminReports } from "@/components/admin/reports-admin";
import type { ReportData } from "@/lib/reports";
export function AdminReportsClient() {
  const result = useAdminPageData<{ report: ReportData }>("key=reports");
  if (!result.data) return <PageState {...result} />;
  return <AdminReports initialReport={result.data.report} />;
}

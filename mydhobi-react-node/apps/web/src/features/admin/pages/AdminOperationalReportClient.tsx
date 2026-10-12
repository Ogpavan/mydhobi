import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { OperationalReportView } from "@/components/admin/operational-report-view";
import type { OperationalReportData } from "@/lib/operational-reports";
import { useParams } from "@/platform/navigation";
export function AdminOperationalReportClient() {
  const { report } = useParams<{ report: string }>();
  const result = useAdminPageData<{ report: OperationalReportData }>(
    `key=operational-report&report=${encodeURIComponent(report)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <OperationalReportView initialReport={result.data.report} />;
}

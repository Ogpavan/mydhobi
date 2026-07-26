import { AdminReports } from "@/components/admin/reports-admin";
import { getReportData } from "@/lib/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  return <AdminReports initialReport={await getReportData(30)} />;
}

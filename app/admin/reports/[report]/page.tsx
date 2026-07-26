import { notFound } from "next/navigation";

import { OperationalReportView } from "@/components/admin/operational-report-view";
import {
  getOperationalReport,
  isOperationalReportKey,
} from "@/lib/operational-reports";

export const dynamic = "force-dynamic";

export default async function OperationalReportPage({
  params,
}: {
  params: Promise<{ report: string }>;
}) {
  const { report } = await params;
  if (!isOperationalReportKey(report)) notFound();

  return (
    <OperationalReportView
      initialReport={await getOperationalReport(report, 30)}
    />
  );
}

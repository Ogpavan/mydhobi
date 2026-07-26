import { redirect } from "next/navigation";

import { WalletReportView } from "@/components/admin/wallet-report-view";
import { getCurrentUser } from "@/lib/session";
import { getWalletReport } from "@/lib/wallet-report";

export const dynamic = "force-dynamic";

export default async function WalletReportPage() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") redirect("/admin/reports");

  return <WalletReportView report={await getWalletReport()} />;
}

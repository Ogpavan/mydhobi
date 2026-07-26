import { AdminPayments } from "@/components/admin/payments-admin";
import { getPaymentStats, listPayments } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [payments, stats] = await Promise.all([
    listPayments(),
    getPaymentStats(),
  ]);
  return <AdminPayments initialPayments={payments} stats={stats} />;
}

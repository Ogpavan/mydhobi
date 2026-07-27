import { AdminComplaints } from "@/components/admin/complaints-admin";
import { getComplaintStats, listComplaints } from "@/lib/support";

export const dynamic = "force-dynamic";

export default async function ComplaintsPage() {
  const [complaints, stats] = await Promise.all([
    listComplaints(),
    getComplaintStats(),
  ]);
  return (
    <AdminComplaints initialComplaints={complaints} initialStats={stats} />
  );
}

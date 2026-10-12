import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminComplaints } from "@/components/admin/complaints-admin";
import type { ComplaintRecord, ComplaintStats } from "@/lib/support";
export function AdminComplaintsClient() {
  const result = useAdminPageData<{
    complaints: ComplaintRecord[];
    stats: ComplaintStats;
  }>("key=complaints");
  if (!result.data) return <PageState {...result} />;
  return (
    <AdminComplaints
      initialComplaints={result.data.complaints}
      initialStats={result.data.stats}
    />
  );
}

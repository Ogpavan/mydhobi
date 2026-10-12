import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminRiders } from "@/components/admin/riders-admin";
import type { RiderRecord } from "@/lib/riders";
export function AdminRidersClient() {
  const result = useAdminPageData<{ riders: RiderRecord[] }>("key=riders");
  if (!result.data) return <PageState {...result} />;
  return <AdminRiders initialRiders={result.data.riders} />;
}

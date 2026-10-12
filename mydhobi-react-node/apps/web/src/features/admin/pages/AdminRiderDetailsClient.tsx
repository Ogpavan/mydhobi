import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminRiderDetails } from "@/components/admin/riders-admin";
import type { RiderDetails } from "@/lib/riders";
import { useParams } from "@/platform/navigation";
export function AdminRiderDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{ rider: RiderDetails }>(
    `key=rider-detail&id=${encodeURIComponent(id)}`,
  );
  if (!result.data) return <PageState {...result} />;
  return <AdminRiderDetails initialRider={result.data.rider} />;
}

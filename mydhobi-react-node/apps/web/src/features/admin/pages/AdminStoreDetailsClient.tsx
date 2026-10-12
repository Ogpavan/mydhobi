import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { StoreDetailView } from "@/components/admin/store-detail-view";
import type { SetupRole } from "@/lib/roles";
import type { StoreTeamMember } from "@/lib/store-team";
import type { Store } from "@/lib/stores";
import { useParams } from "@/platform/navigation";
export function AdminStoreDetailsClient() {
  const { id } = useParams<{ id: string }>();
  const result = useAdminPageData<{
    store: Store;
    members: StoreTeamMember[];
    roles: SetupRole[];
  }>(`key=store-detail&id=${encodeURIComponent(id)}`);
  if (!result.data) return <PageState {...result} />;
  return (
    <StoreDetailView
      store={result.data.store}
      members={result.data.members}
      roles={result.data.roles}
    />
  );
}

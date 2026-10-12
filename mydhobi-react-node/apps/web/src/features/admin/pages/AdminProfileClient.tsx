import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { AdminProfileForm } from "@/components/admin/admin-profile-form";
import type { AuthUser } from "@/lib/auth";
export function AdminProfileClient() {
  const result = useAdminPageData<{ user: AuthUser }>("key=profile", 60_000);
  if (!result.data) return <PageState {...result} />;
  return <AdminProfileForm user={result.data.user} />;
}

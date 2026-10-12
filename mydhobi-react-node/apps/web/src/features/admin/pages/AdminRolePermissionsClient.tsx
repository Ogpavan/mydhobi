import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { RolePermissionsAdmin } from "@/components/admin/role-permissions-admin";
import type { PermissionGroup } from "@/lib/role-permissions";
import type { SetupRole } from "@/lib/roles";
export function AdminRolePermissionsClient() {
  const result = useAdminPageData<{
    roles: SetupRole[];
    groups: PermissionGroup[];
    assignments: Record<string, string[]>;
  }>("key=role-permissions", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <RolePermissionsAdmin
      roles={result.data.roles}
      groups={result.data.groups}
      initialAssignments={result.data.assignments}
    />
  );
}

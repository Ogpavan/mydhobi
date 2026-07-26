import { redirect } from "next/navigation";

import { RolePermissionsAdmin } from "@/components/admin/role-permissions-admin";
import {
  listRolePermissionAssignments,
  permissionGroups,
} from "@/lib/role-permissions";
import { listSetupRoles } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RolePermissionsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/admin/dashboard");
  }

  const [roles, initialAssignments] = await Promise.all([
    listSetupRoles(),
    listRolePermissionAssignments(),
  ]);

  return (
    <RolePermissionsAdmin
      roles={roles}
      groups={permissionGroups}
      initialAssignments={initialAssignments}
    />
  );
}

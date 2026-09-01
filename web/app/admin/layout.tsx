import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/session";
import { listSidebarSettings } from "@/lib/sidebar-settings";
import { getAllowedAdminPageKeys } from "@/lib/role-permissions";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  if (user.role === "customer") {
    redirect("/customer");
  }

  const [sidebarItems, allowedPageKeys] = await Promise.all([
    listSidebarSettings(),
    getAllowedAdminPageKeys(user),
  ]);

  return (
    <AdminShell user={user} sidebarItems={sidebarItems} allowedPageKeys={allowedPageKeys}>
      {children}
    </AdminShell>
  );
}

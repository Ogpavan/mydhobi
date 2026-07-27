import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentUser } from "@/lib/session";
import { listSidebarSettings } from "@/lib/sidebar-settings";

export default async function DeveloperLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  if (!user) redirect("/");
  if (user.role !== "admin") redirect("/admin/dashboard");

  const sidebarItems = await listSidebarSettings();

  return (
    <AdminShell user={user} sidebarItems={sidebarItems}>
      {children}
    </AdminShell>
  );
}

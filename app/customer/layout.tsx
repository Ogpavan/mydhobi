import { redirect } from "next/navigation";

import { CustomerThemeSync } from "@/components/customer/customer-theme-sync";
import { getCustomerSettings } from "@/lib/customer-settings";
import { getCurrentUser } from "@/lib/session";

export default async function CustomerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "customer") redirect("/admin/dashboard");
  const settings = await getCustomerSettings(user.id);
  return (
    <>
      <CustomerThemeSync darkMode={settings.darkMode} />
      {children}
    </>
  );
}

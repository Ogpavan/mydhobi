import { CustomersView } from "@/components/admin/customers-view";
import { listCustomers } from "@/lib/customers";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const [customers, user] = await Promise.all([listCustomers(), getCurrentUser()]);
  return (
    <CustomersView
      initialCustomers={customers}
      canManageWallet={user?.role === "admin"}
    />
  );
}

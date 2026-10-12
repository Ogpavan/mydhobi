import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { CustomersView } from "@/components/admin/customers-view";
import type { Customer } from "@/lib/customers";
export function AdminCustomersClient() {
  const result = useAdminPageData<{
    customers: Customer[];
    canManageWallet: boolean;
  }>("key=customers");
  if (!result.data) return <PageState {...result} />;
  return (
    <CustomersView
      initialCustomers={result.data.customers}
      canManageWallet={result.data.canManageWallet}
    />
  );
}

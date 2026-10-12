import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { useAdminPageData } from "@/components/admin/admin-client-data";
import { OrderChargeMaster } from "@/components/admin/order-charge-master";
import type { OrderCharge } from "@/lib/order-charges";

export function AdminChargeMasterClient() {
  const result = useAdminPageData<{ charges: OrderCharge[] }>(
    "key=charge-master",
  );
  if (!result.data) return <PageState {...result} />;
  return <OrderChargeMaster initialCharges={result.data.charges} />;
}

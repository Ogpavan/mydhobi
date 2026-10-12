import { useAdminPageData } from "@/components/admin/admin-client-data";
import { AdminDataState as PageState } from "@/components/admin/admin-data-state";
import { LocationSetup } from "@/components/admin/location-setup";
import type {
  SetupInventoryCategory,
  SetupInventoryUnit,
} from "@/lib/inventory-setup";
import type { SetupCity, SetupState } from "@/lib/locations";
import type { SetupRole } from "@/lib/roles";
export function AdminBasicSetupClient() {
  const result = useAdminPageData<{
    states: SetupState[];
    cities: SetupCity[];
    roles: SetupRole[];
    inventoryCategories: SetupInventoryCategory[];
    inventoryUnits: SetupInventoryUnit[];
  }>("key=basic-setup", 60_000);
  if (!result.data) return <PageState {...result} />;
  return (
    <LocationSetup
      initialStates={result.data.states}
      initialCities={result.data.cities}
      initialRoles={result.data.roles}
      initialInventoryCategories={result.data.inventoryCategories}
      initialInventoryUnits={result.data.inventoryUnits}
    />
  );
}

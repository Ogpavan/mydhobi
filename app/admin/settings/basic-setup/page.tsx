import { LocationSetup } from "@/components/admin/location-setup";
import { listSetupCities, listSetupStates } from "@/lib/locations";
import { listSetupRoles } from "@/lib/roles";
import {
  listSetupInventoryCategories,
  listSetupInventoryUnits,
} from "@/lib/inventory-setup";

export const dynamic = "force-dynamic";

export default async function BasicSetupPage() {
  const [states, cities, roles, inventoryCategories, inventoryUnits] = await Promise.all([
    listSetupStates(),
    listSetupCities(),
    listSetupRoles(),
    listSetupInventoryCategories(),
    listSetupInventoryUnits(),
  ]);

  return (
    <LocationSetup
      initialStates={states}
      initialCities={cities}
      initialRoles={roles}
      initialInventoryCategories={inventoryCategories}
      initialInventoryUnits={inventoryUnits}
    />
  );
}

import { StoreForm } from "@/components/admin/store-form";
import { listSetupCities, listSetupStates } from "@/lib/locations";

export const dynamic = "force-dynamic";

export default async function CreateStorePage() {
  const [states, cities] = await Promise.all([
    listSetupStates(),
    listSetupCities(),
  ]);
  const activeStates = states.filter((state) => state.isActive);
  const activeStateIds = new Set(activeStates.map((state) => state.id));
  const activeCities = cities.filter(
    (city) => city.isActive && activeStateIds.has(city.stateId),
  );

  return (
    <StoreForm
      mode="create"
      locationStates={activeStates}
      locationCities={activeCities}
    />
  );
}

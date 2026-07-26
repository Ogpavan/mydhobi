import { InventoryView } from "@/components/admin/inventory-view";
import { listInventoryItems } from "@/lib/inventory";
import {
  listSetupInventoryCategories,
  listSetupInventoryUnits,
} from "@/lib/inventory-setup";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [items, categories, units] = await Promise.all([
    listInventoryItems(),
    listSetupInventoryCategories(),
    listSetupInventoryUnits(),
  ]);
  const activeUnits = units.filter((unit) => unit.isActive);
  const activeUnitIds = new Set(activeUnits.map((unit) => unit.id));
  return (
    <InventoryView
      initialItems={items}
      categories={categories.filter(
        (category) => category.isActive && activeUnitIds.has(category.unitTypeId),
      )}
      units={activeUnits}
    />
  );
}

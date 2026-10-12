export type SetupInventoryUnit = {
  id: string;
  name: string;
  categoryCount: number;
  isActive: boolean;
};
export type SetupInventoryCategory = {
  id: string;
  name: string;
  unitTypeId: string;
  unitTypeName: string;
  isActive: boolean;
};
type UnitRow = {
  id: string;
  name: string;
  category_count: string;
  is_active: boolean;
};
type CategoryRow = {
  id: string;
  name: string;
  unit_type_id: string;
  unit_type_name: string;
  is_active: boolean;
};

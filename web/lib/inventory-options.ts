export const inventoryCategories = [
  "Detergent",
  "Fabric Softener",
  "Starch",
  "Bleach",
  "Spot Remover",
  "Perfume/Fragrance",
  "Packaging Bag",
  "Hanger",
  "Tag",
  "Barcode Sticker",
  "Laundry Basket",
  "Machine Spare Part",
  "Cleaning Supplies",
  "Office Supplies",
  "Uniform",
] as const;

export const inventoryUnitTypes = [
  "Piece",
  "Bottle",
  "Kg",
  "Gram",
  "Liter",
  "ml",
  "Roll",
  "Box",
  "Packet",
  "Pair",
] as const;

export type InventoryCategory = (typeof inventoryCategories)[number];
export type InventoryUnitType = (typeof inventoryUnitTypes)[number];

export const PRICING_UNITS = ["piece", "kg", "pair", "set", "sq_ft"] as const;
export type PricingUnit = (typeof PRICING_UNITS)[number];

export const PRICING_UNIT_LABELS: Record<PricingUnit, string> = {
  piece: "Per piece",
  kg: "Per kg",
  pair: "Per pair",
  set: "Per set",
  sq_ft: "Per sq. ft.",
};

export type ItemCategory = {
  id: number;
  name: string;
  description: string;
  imagePath: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ItemMasterService = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imagePath: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ItemListRow = {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  shortCode: string;
  description: string;
  imagePath: string;
  defaultPricingUnit: PricingUnit;
  isActive: boolean;
  sortOrder: number;
  serviceCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ItemServiceMapping = {
  id: number | null;
  garmentId: number;
  serviceId: number;
  serviceName: string;
  serviceImagePath: string;
  isEnabled: boolean;
  price: number;
  pricingUnit: PricingUnit;
  turnaroundHours: number;
  expressAvailable: boolean;
  expressPrice: number | null;
  expressTurnaroundHours: number | null;
  updatedAt: string | null;
};

export type ItemDetail = ItemListRow & {
  mappings: ItemServiceMapping[];
};

export type StoreRateOverride = {
  id: number;
  storeId: string;
  storeName: string;
  mappingId: number;
  price: number;
  pricingUnit: PricingUnit | null;
  turnaroundHours: number | null;
  expressAvailable: boolean | null;
  expressPrice: number | null;
  expressTurnaroundHours: number | null;
  updatedAt: string;
};

export type RateCardGroup = {
  id: number;
  name: string;
  tariffCode: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RateCardStoreAssignment = {
  storeId: string;
  storeName: string;
  groupId: number | null;
  groupName: string | null;
  tariffCode: string | null;
};

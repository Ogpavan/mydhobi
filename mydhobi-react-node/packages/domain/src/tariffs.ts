import type { PricingUnit } from "./item-master-types";
export type TariffRate = {
  price: number | null;
  isAvailable: boolean;
  pricingUnit: PricingUnit;
};
export type TariffService = {
  id: number;
  name: string;
};
export type TariffMapping = {
  isMapped: boolean;
  pricingUnit: PricingUnit;
};
export type TariffItem = {
  id: number;
  name: string;
  imagePath?: string;
  shortCode: string;
  categoryId: number;
  defaultPricingUnit: PricingUnit;
  mappings: Record<string, TariffMapping>;
  rates: Record<string, TariffRate>;
};
export type TariffSheet = {
  services: TariffService[];
  items: TariffItem[];
};
export type TariffChange = {
  itemId: number;
  serviceId: number;
  price: number | null;
  isAvailable: boolean;
};

import type { PricingUnit } from "./item-master-types";
export type ServiceMappingService = {
  id: number;
  name: string;
};
export type ServiceMappingValue = {
  isMapped: boolean;
  pricingUnit: PricingUnit;
};
export type ServiceMappingItem = {
  id: number;
  name: string;
  shortCode: string;
  categoryId: number;
  defaultPricingUnit: PricingUnit;
  mappings: Record<string, ServiceMappingValue>;
};
export type ServiceMappingSheet = {
  services: ServiceMappingService[];
  items: ServiceMappingItem[];
};
export type ServiceMappingChange = {
  itemId: number;
  serviceId: number;
  isMapped: boolean;
  pricingUnit: PricingUnit;
};

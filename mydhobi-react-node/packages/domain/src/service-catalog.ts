import type { GARMENT_AUDIENCES, GarmentAudience } from "./garment-audience";
export type { GARMENT_AUDIENCES } from "./garment-audience";
export type { GarmentAudience } from "./garment-audience";
export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  imagePath: string;
  groupId?: string;
  audience: GarmentAudience;
  displayOrder: number;
  isActive: boolean;
};
export type GarmentCategory = ServiceCategory;
export const CATALOG_UNITS = [
  "piece",
  "kg",
  "pair",
  "seat",
  "sq_ft",
  "set",
  "fixed",
] as const;
export type CatalogUnit = (typeof CATALOG_UNITS)[number];
export type CatalogVariant = {
  id: string;
  serviceId: string;
  name: string;
  unit: CatalogUnit;
  regularPrice: number;
  expressPrice: number | null;
  displayOrder: number;
  isActive: boolean;
};
export type CatalogService = {
  id: string;
  categoryId: string;
  categoryName: string;
  garmentId: string;
  garmentName: string;
  garmentImagePath: string;
  name: string;
  slug: string;
  imagePath: string;
  unit: CatalogUnit;
  regularPrice: number;
  expressPrice: number | null;
  turnaround: string;
  displayOrder: number;
  isActive: boolean;
  variants: CatalogVariant[];
};

import type { CatalogService, ServiceCategory } from "./service-catalog";
export type OrderingCategoryGroup = {
  id: string;
  name: string;
  description: string;
  imagePath: string;
  displayOrder: number;
  isActive: boolean;
};
export type OrderingCatalog = {
  store: { id: string; name: string } | null;
  categoryGroups: OrderingCategoryGroup[];
  categories: ServiceCategory[];
  services: CatalogService[];
};
export type OrderQuote = {
  storeId: string;
  items: Array<{
    garmentId: string;
    serviceId: string;
    garmentName: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
  }>;
  subtotal: number;
  discount: number;
  discountLabel: string;
  deliveryFee: number;
  tax: number;
  total: number;
};
export const pickupSlots = [
  "10:00–12:00",
  "12:00–14:00",
  "14:00–16:00",
  "16:00–18:00",
] as const;
export function groupServices(services: CatalogService[]) {
  return [
    ...new Map(
      services.map((service) => [
        service.id,
        { id: service.id, name: service.name },
      ]),
    ).values(),
  ];
}

import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { ServicesListView } from "@/components/customer/services-list-view";
import type { Offer } from "@/lib/offers";
import type { CatalogService, ServiceCategory } from "@/lib/service-catalog";
type CatalogResponse = {
  categories: ServiceCategory[];
  services: CatalogService[];
  offers: Offer[];
};
export function CustomerServicesClient() {
  const catalog = useCustomerData<CatalogResponse>(
    "/api/customer/catalog",
    300_000,
  );
  if (catalog.loading)
    return <CustomerPageSkeleton variant="services" rows={5} />;
  if (catalog.error)
    return <CustomerPageError message={catalog.error} retry={catalog.retry} />;
  if (!catalog.data)
    return <CustomerPageSkeleton variant="services" rows={5} />;
  return (
    <ServicesListView
      categories={catalog.data.categories}
      services={catalog.data.services}
      offer={catalog.data.offers[0] ?? null}
    />
  );
}

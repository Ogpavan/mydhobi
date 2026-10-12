import { ServiceDetailsView } from "@/components/customer/checkout-flow-views";
import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import type { Offer } from "@/lib/offers";
import type { CatalogService, ServiceCategory } from "@/lib/service-catalog";
import { useParams, useRouter } from "@/platform/navigation";
import { useEffect } from "react";
type CatalogResponse = {
  categories: ServiceCategory[];
  services: CatalogService[];
  offers: Offer[];
};
export function CustomerServiceDetailsClient() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const catalog = useCustomerData<CatalogResponse>(
    "/api/customer/catalog",
    300_000,
  );
  const service = catalog.data?.services.find(
    (item) => item.slug === params.slug,
  );

  useEffect(() => {
    if (!catalog.loading && catalog.data && !service)
      router.replace("/customer/services");
  }, [catalog.data, catalog.loading, router, service]);

  if (catalog.loading || (!service && !catalog.error))
    return <CustomerPageSkeleton variant="detail" rows={4} />;
  if (catalog.error)
    return <CustomerPageError message={catalog.error} retry={catalog.retry} />;
  return service ? <ServiceDetailsView service={service} /> : null;
}

import { ServicePricingAdmin } from "@/components/admin/service-catalog-admin";
import { listCatalogServices } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

export default async function ServicePricingPage() {
  const services = await listCatalogServices(true);
  return <ServicePricingAdmin initialServices={services} />;
}

import { CatalogServicesAdmin } from "@/components/admin/service-catalog-admin";
import {
  listCatalogServices,
  listServiceCategories,
} from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [categories, services] = await Promise.all([
    listServiceCategories(true),
    listCatalogServices(true),
  ]);

  return (
    <CatalogServicesAdmin
      initialCategories={categories}
      initialServices={services}
    />
  );
}

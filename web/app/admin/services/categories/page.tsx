import { ServiceCategoriesAdmin } from "@/components/admin/service-catalog-admin";
import { listServiceCategories } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

export default async function ServiceCategoriesPage() {
  const categories = await listServiceCategories(true);
  return <ServiceCategoriesAdmin initialCategories={categories} />;
}

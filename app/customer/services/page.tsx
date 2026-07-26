import type { Metadata } from "next";

import { ServicesListView } from "@/components/customer/services-list-view";
import {
  listCatalogServices,
  listServiceCategories,
} from "@/lib/service-catalog";
import { listOffers } from "@/lib/offers";

export const metadata: Metadata = { title: { absolute: "Our Services | MyDhobi" } };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const [categories, services, offers] = await Promise.all([
    listServiceCategories(false),
    listCatalogServices(false),
    listOffers(true),
  ]);

  return <ServicesListView categories={categories} services={services} offer={offers[0]??null} />;
}

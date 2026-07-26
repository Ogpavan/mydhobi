import { notFound } from "next/navigation";

import { ServiceDetailsView } from "@/components/customer/checkout-flow-views";
import { getCatalogServiceBySlug } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";

export default async function ServiceDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await getCatalogServiceBySlug(slug);
  if (!service) notFound();
  return <ServiceDetailsView service={service} />;
}

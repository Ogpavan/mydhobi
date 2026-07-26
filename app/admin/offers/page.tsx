import { AdminOffers } from "@/components/admin/offers-admin";
import { listOffers } from "@/lib/offers";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  return <AdminOffers initialOffers={await listOffers()} />;
}

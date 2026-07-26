import { AddressesView } from "@/components/customer/checkout-flow-views";
import { listPortalAddresses } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export default async function AddressesPage() {
  const user = await getCurrentUser();
  return <AddressesView addresses={user ? await listPortalAddresses(user.id) : []} />;
}

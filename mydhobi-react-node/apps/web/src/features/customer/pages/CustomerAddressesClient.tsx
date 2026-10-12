import { AddressesView } from "@/components/customer/checkout-flow-views";
import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import type { PortalAddress } from "@/lib/customer-portal";
type AddressesResponse = { addresses: PortalAddress[] };
export function CustomerAddressesClient() {
  const addresses = useCustomerData<AddressesResponse>(
    "/api/customer/addresses",
    15_000,
  );
  if (addresses.loading)
    return <CustomerPageSkeleton variant="list" rows={4} />;
  if (addresses.error)
    return (
      <CustomerPageError message={addresses.error} retry={addresses.retry} />
    );
  return <AddressesView addresses={addresses.data?.addresses ?? []} />;
}

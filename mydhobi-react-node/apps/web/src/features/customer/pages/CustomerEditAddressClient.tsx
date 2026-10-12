import { AddAddressView } from "@/components/customer/checkout-flow-views";
import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import type { PortalAddress } from "@/lib/customer-portal";
import { useParams, useRouter } from "@/platform/navigation";
import { useEffect } from "react";
type AddressesResponse = { addresses: PortalAddress[] };
export function CustomerEditAddressClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const addresses = useCustomerData<AddressesResponse>(
    "/api/customer/addresses",
    15_000,
  );
  const address = addresses.data?.addresses.find(
    (item) => item.id === params.id,
  );
  useEffect(() => {
    if (!addresses.loading && addresses.data && !address)
      router.replace("/customer/addresses");
  }, [address, addresses.data, addresses.loading, router]);
  if (addresses.loading || (!address && !addresses.error))
    return <CustomerPageSkeleton variant="form" rows={4} />;
  if (addresses.error)
    return (
      <CustomerPageError message={addresses.error} retry={addresses.retry} />
    );
  return address ? <AddAddressView address={address} /> : null;
}

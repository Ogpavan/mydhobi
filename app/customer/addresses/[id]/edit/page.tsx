import { notFound } from "next/navigation";

import { AddAddressView } from "@/components/customer/checkout-flow-views";
import { listPortalAddresses } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export default async function EditAddressPage({params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();if(!user)notFound();
  const {id}=await params;
  const address=(await listPortalAddresses(user.id)).find(item=>item.id===id);
  if(!address)notFound();
  return <AddAddressView address={address} />;
}

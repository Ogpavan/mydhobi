import { redirect } from "next/navigation";

import { OrderSuccessView } from "@/components/customer/checkout-flow-views";
import { getPortalOrder } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const user=await getCurrentUser();
  if(!user||!order)redirect("/customer/orders");
  const placedOrder=await getPortalOrder(user.id,order);
  if(!placedOrder)redirect("/customer/orders");
  return <OrderSuccessView order={placedOrder} />;
}

import { redirect } from "next/navigation";

import { PaymentView } from "@/components/customer/checkout-flow-views";
import { getPortalWallet } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export default async function PaymentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  const wallet = await getPortalWallet(user.id);
  return <PaymentView walletBalance={wallet.balance} />;
}

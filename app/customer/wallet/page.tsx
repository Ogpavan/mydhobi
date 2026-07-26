import type { Metadata } from "next";

import { WalletView } from "@/components/customer/wallet-view";
import { getPortalWallet } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: { absolute: "My Wallet | MyDhobi" } };

export default async function WalletPage() {
  const user = await getCurrentUser();
  const wallet = user ? await getPortalWallet(user.id) : { balance: 0, transactions: [] };
  return <WalletView balance={wallet.balance} portalTransactions={wallet.transactions} />;
}

import type { Metadata } from "next";

import { CustomerWalletClient } from "@/components/customer/customer-client-pages";

export const metadata: Metadata = { title: { absolute: "My Wallet | MyDhobi" } };

export default function WalletPage() {
  return <CustomerWalletClient />;
}

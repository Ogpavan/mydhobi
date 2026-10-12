import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
import { WalletView } from "@/components/customer/wallet-view";
type WalletResponse = {
  wallet: {
    balance: number;
    transactions: Array<{
      id: string;
      label: string;
      amount: number;
      createdAt: string;
    }>;
  };
};
export function CustomerWalletClient() {
  const wallet = useCustomerData<WalletResponse>(
    "/api/customer/wallet",
    15_000,
  );
  if (wallet.loading) return <CustomerPageSkeleton variant="list" rows={5} />;
  if (wallet.error)
    return <CustomerPageError message={wallet.error} retry={wallet.retry} />;
  return wallet.data ? (
    <WalletView
      balance={wallet.data.wallet.balance}
      portalTransactions={wallet.data.wallet.transactions}
    />
  ) : (
    <CustomerPageSkeleton variant="list" />
  );
}

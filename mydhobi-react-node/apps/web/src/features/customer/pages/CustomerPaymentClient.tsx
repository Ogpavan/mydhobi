import { PaymentView } from "@/components/customer/checkout-flow-views";
import { useCustomerData } from "@/components/customer/customer-client-data";
import {
  CustomerPageError,
  CustomerPageSkeleton,
} from "@/components/customer/customer-page-state";
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
export function CustomerPaymentClient() {
  const wallet = useCustomerData<WalletResponse>(
    "/api/customer/wallet",
    15_000,
  );
  if (wallet.loading) return <CustomerPageSkeleton variant="form" rows={4} />;
  if (wallet.error)
    return <CustomerPageError message={wallet.error} retry={wallet.retry} />;
  return <PaymentView walletBalance={wallet.data?.wallet.balance ?? 0} />;
}

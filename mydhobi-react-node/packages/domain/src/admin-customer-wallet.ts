export type AdminWalletTransaction = {
  id: string;
  label: string;
  note: string;
  amount: number;
  createdAt: string;
};
export type AdminCustomerWallet = {
  customerId: string;
  customerName: string;
  hasLogin: boolean;
  balance: number;
  transactions: AdminWalletTransaction[];
};
type CustomerWalletRow = {
  id: string;
  full_name: string;
  user_id: string | null;
};

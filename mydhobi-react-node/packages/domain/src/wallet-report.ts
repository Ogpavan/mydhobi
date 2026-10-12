export type WalletReportTransaction = {
  id: string;
  customerName: string;
  mobile: string;
  label: string;
  reason: string;
  amount: number;
  source: string;
  addedBy: string;
  createdAt: string;
};
export type WalletReportData = {
  summary: {
    currentBalance: number;
    totalCredited: number;
    totalDeducted: number;
    walletCustomers: number;
  };
  transactions: WalletReportTransaction[];
};

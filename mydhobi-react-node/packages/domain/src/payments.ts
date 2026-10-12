export const paymentStatuses = [
  "Pending",
  "Paid",
  "Failed",
  "Refunded",
  "Cancelled",
] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PaymentRecord = {
  id: string;
  reference: string;
  orderId: string | null;
  customerName: string;
  customerMobile: string;
  kind: string;
  method: string;
  status: PaymentStatus;
  amount: number;
  createdAt: string;
};
export type PaymentStats = {
  collected: number;
  pending: number;
  refunded: number;
  transactions: number;
};

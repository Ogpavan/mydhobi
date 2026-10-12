export const reportRanges = [7, 30, 90, 365] as const;
export type ReportRange = (typeof reportRanges)[number];
export type ReportData = {
  range: ReportRange;
  summary: {
    revenue: number;
    orders: number;
    customers: number;
    averageOrder: number;
  };
  dailyOrders: Array<{ date: string; orders: number; revenue: number }>;
  topServices: Array<{ service: string; orders: number; revenue: number }>;
  orderStatuses: Array<{ status: string; orders: number }>;
  paymentMethods: Array<{
    method: string;
    transactions: number;
    amount: number;
  }>;
};

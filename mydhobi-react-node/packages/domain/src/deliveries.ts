export const deliveryStatuses = [
  "Ready",
  "Assigned",
  "Out for Delivery",
  "Delivered",
  "Failed",
  "Cancelled",
] as const;
export type DeliveryStatus = (typeof deliveryStatuses)[number];
export type DeliveryTask = {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  address: string;
  service: string;
  amount: number;
  paymentStatus: string;
  scheduledAt: string;
  status: DeliveryStatus;
  riderId: string | null;
  riderName: string | null;
  notes: string;
};
export type DeliveryStats = {
  today: number;
  delivered: number;
  pending: number;
  unassigned: number;
};

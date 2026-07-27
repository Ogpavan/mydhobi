export type CustomerOrderStatus =
  | "In Progress"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type CustomerOrder = {
  id: string;
  placedAt: string;
  shortDate: string;
  service: string;
  itemCount: number;
  amount: number;
  status: CustomerOrderStatus;
  pickup: string;
  delivery: string;
  paid: boolean;
};

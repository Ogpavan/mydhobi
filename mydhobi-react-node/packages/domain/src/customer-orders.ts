export type CustomerOrderStatus =
  | "In Progress"
  | "Pickup Scheduled"
  | "Rider Assigned"
  | "Out for Pickup"
  | "Picked Up"
  | "Received at Store"
  | "Inspection in Progress"
  | "Awaiting Confirmation"
  | "Confirmed"
  | "In Cleaning"
  | "Quality Check"
  | "Ready"
  | "Delivery Assigned"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";
export type CustomerOrder = {
  invoicePending?: boolean;
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

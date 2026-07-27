import type { ReferenceSpriteName } from "@/components/admin/reference-sprite-icon";

export type OrderStatus =
  | "New"
  | "Picked Up"
  | "In Cleaning"
  | "Ready"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type OperationStatus = "Scheduled" | "Out for Delivery" | "Delivered";
export type PaymentStatus = "Paid" | "Unpaid" | "Partial";

export type OperationOrder = {
  id: string;
  customer: string;
  area: string;
  time: string;
  status: OperationStatus;
  avatar: ReferenceSpriteName;
};

export type RecentOrder = {
  id: string;
  customer: string;
  service: string;
  pickupDate: string;
  deliveryDate: string;
  status: OrderStatus;
  payment: PaymentStatus;
  amount: string;
};

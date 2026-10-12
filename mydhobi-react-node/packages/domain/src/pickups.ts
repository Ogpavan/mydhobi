export const pickupStatuses = [
  "Scheduled",
  "Assigned",
  "Out for Pickup",
  "Completed",
  "Failed",
  "Cancelled",
] as const;
export type PickupStatus = (typeof pickupStatuses)[number];
export type PickupRider = {
  id: string;
  name: string;
  mobile: string;
  area: string;
  status: "Available" | "On Duty" | "Off Duty";
};
export type PickupTask = {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  address: string;
  service: string;
  scheduledAt: string;
  status: PickupStatus;
  riderId: string | null;
  riderName: string | null;
  notes: string;
};
export type PickupStats = {
  today: number;
  completed: number;
  pending: number;
  unassigned: number;
};

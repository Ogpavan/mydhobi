export const riderStatuses = ["Available", "On Duty", "Off Duty"] as const;
export type RiderStatus = (typeof riderStatuses)[number];
export type RiderRecord = {
  id: string;
  name: string;
  mobile: string;
  area: string;
  status: RiderStatus;
  todayJobs: number;
  activeJobs: number;
};
export type RiderJob = {
  id: string;
  type: "Pickup" | "Delivery";
  orderId: string;
  customerName: string;
  address: string;
  scheduledAt: string;
  status: string;
};
export type RiderDetails = RiderRecord & {
  jobs: RiderJob[];
};

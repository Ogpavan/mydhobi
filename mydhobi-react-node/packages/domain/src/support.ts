export const complaintStatuses = ["Open", "In Progress", "Resolved"] as const;
export type ComplaintStatus = (typeof complaintStatuses)[number];
export type ComplaintRecord = {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  customerMobile: string;
  subject: string;
  details: string;
  response: string;
  status: ComplaintStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};
export type ComplaintStats = {
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
};

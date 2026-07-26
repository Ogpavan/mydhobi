export const orderStatuses = [
  "New",
  "Picked Up",
  "In Cleaning",
  "Ready",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
] as const;

export type PortalOrderStatus = (typeof orderStatuses)[number];

export const allowedOrderTransitions: Record<
  PortalOrderStatus,
  PortalOrderStatus[]
> = {
  New: ["Picked Up", "Cancelled"],
  "Picked Up": ["In Cleaning", "Cancelled"],
  "In Cleaning": ["Ready", "Cancelled"],
  Ready: ["Out for Delivery", "Cancelled"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

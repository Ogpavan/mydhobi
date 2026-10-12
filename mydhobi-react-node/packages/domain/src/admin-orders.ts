import type { PortalOrder } from "./customer-portal";
import type { PortalOrderStatus } from "./order-lifecycle";
import type { allowedOrderTransitions } from "./order-lifecycle";
export type { allowedOrderTransitions };
export type AdminOrderSummary = {
  id: string;
  storeId: string | null;
  storeName: string | null;
  customerName: string;
  customerMobile: string;
  service: string;
  itemCount: number;
  amount: number;
  pickupAt: string;
  paymentStatus: string;
  paymentMethod: string;
  status: PortalOrderStatus;
  createdAt: string;
};
export type AdminOrder = PortalOrder & {
  customerId: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  pickupTask: AdminOrderTask | null;
  deliveryTask: AdminOrderTask | null;
  payment: AdminOrderPayment | null;
  inspectionCatalog?: Array<{
    garmentId: string;
    garmentName: string;
    serviceId: string;
    serviceName: string;
    price: number;
    unit: string;
  }>;
};
export type AdminOrderStats = {
  total: number;
  inProcess: number;
  ready: number;
  todayRevenue: number;
};
export type AdminOrderStore = { id: string; name: string };
export type AdminOrderTask = {
  id: string;
  scheduledAt: string;
  status: string;
  riderId: string | null;
  riderName: string | null;
  notes: string;
};
export type AdminOrderPayment = {
  id: string;
  reference: string;
  method: string;
  status: string;
  amount: number;
};

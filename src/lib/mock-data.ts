import { addHours, format, subDays } from "date-fns";
import { ORDER_STATUS_META, SERVICE_DEFINITIONS, type OrderStatus, type ServiceId } from "@/lib/constants";

export type LaundryItem = {
  id: string;
  name: string;
  category: "Men" | "Women" | "Kids" | "Home" | "Unisex";
  unitPrice: number;
};

export type Service = (typeof SERVICE_DEFINITIONS)[number] & {
  items: LaundryItem[];
};

export type OrderLineItem = LaundryItem & {
  quantity: number;
};

export type TimelineItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  completed: boolean;
};

export type Order = {
  id: string;
  customerId: string;
  customerName: string;
  serviceId: ServiceId;
  serviceName: string;
  status: OrderStatus;
  dateTime: string;
  pickupTime: string;
  deliveryTime: string;
  address: string;
  items: OrderLineItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  paymentStatus: "Paid" | "Pending";
  riderName: string;
  riderPhone: string;
  timeline: TimelineItem[];
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl: string;
  address: string;
  joinedAt: string;
  ordersCount: number;
  totalSpend: number;
  loyaltyTier: "Fresh" | "Premium" | "Elite";
};

export type Rider = {
  id: string;
  name: string;
  phone: string;
  zone: string;
  activeOrders: number;
  rating: number;
  status: "Available" | "On Route" | "Offline";
};

const now = new Date("2026-06-18T10:30:00+05:30");

const itemCatalog: LaundryItem[] = [
  { id: "shirt", name: "Shirt", category: "Men", unitPrice: 25 },
  { id: "jeans", name: "Jeans", category: "Men", unitPrice: 40 },
  { id: "dress", name: "Dress", category: "Women", unitPrice: 60 },
  { id: "sweater", name: "Sweater", category: "Unisex", unitPrice: 55 },
  { id: "kurta", name: "Kurta", category: "Unisex", unitPrice: 35 },
  { id: "bedsheet", name: "Bedsheet", category: "Home", unitPrice: 70 },
];

export const services: Service[] = SERVICE_DEFINITIONS.map((service) => ({
  ...service,
  items: itemCatalog.map((item) => ({
    ...item,
    unitPrice:
      service.id === "ironing"
        ? Math.max(12, Math.round(item.unitPrice * 0.55))
        : service.id === "dry-cleaning"
          ? Math.round(item.unitPrice * 1.8)
          : service.id === "darning"
            ? Math.max(35, Math.round(item.unitPrice * 0.9))
            : item.unitPrice,
  })),
}));

export const customers: Customer[] = [
  {
    id: "cus-001",
    name: "Priya Sharma",
    phone: "+91 98765 43210",
    email: "priya.sharma@example.com",
    avatarUrl: "https://i.pravatar.cc/120?img=47",
    address: "B 250, Baker Street, Indiranagar, Bengaluru",
    joinedAt: "2024-02-12",
    ordersCount: 18,
    totalSpend: 6840,
    loyaltyTier: "Elite",
  },
  {
    id: "cus-002",
    name: "Aarav Mehta",
    phone: "+91 99887 66554",
    email: "aarav.mehta@example.com",
    avatarUrl: "https://i.pravatar.cc/120?img=12",
    address: "18 Lake View Road, Koramangala, Bengaluru",
    joinedAt: "2024-06-03",
    ordersCount: 9,
    totalSpend: 3120,
    loyaltyTier: "Premium",
  },
  {
    id: "cus-003",
    name: "Neha Iyer",
    phone: "+91 91234 56780",
    email: "neha.iyer@example.com",
    avatarUrl: "https://i.pravatar.cc/120?img=31",
    address: "72 Palm Grove, HSR Layout, Bengaluru",
    joinedAt: "2025-01-19",
    ordersCount: 5,
    totalSpend: 1720,
    loyaltyTier: "Fresh",
  },
];

export const riders: Rider[] = [
  { id: "rider-1", name: "Rohan Das", phone: "+91 90001 11122", zone: "Indiranagar", activeOrders: 5, rating: 4.9, status: "On Route" },
  { id: "rider-2", name: "Meera Khan", phone: "+91 90001 11123", zone: "Koramangala", activeOrders: 3, rating: 4.8, status: "Available" },
  { id: "rider-3", name: "Vikram Rao", phone: "+91 90001 11124", zone: "HSR Layout", activeOrders: 0, rating: 4.7, status: "Offline" },
];

function makeTimeline(status: OrderStatus): TimelineItem[] {
  const steps = [
    ["confirmed", "Order confirmed", "We received the order details."],
    ["pickup", "Pickup assigned", "A rider has been assigned for pickup."],
    ["washing", "Cleaning started", "Garments moved to service workflow."],
    ["ready", "Ready for delivery", "Packed and quality checked."],
    ["delivered", "Order delivered", "Delivered to the customer."],
  ] as const;

  const completedByStatus: Record<OrderStatus, number> = {
    "pending-pickup": 1,
    "in-progress": 2,
    "in-washing": 3,
    "ready-delivery": 4,
    "out-for-delivery": 4,
    delivered: 5,
  };

  return steps.map(([id, title, description], index) => ({
    id,
    title,
    description,
    time: format(addHours(subDays(now, 1), index * 3), "dd MMM yyyy, hh:mm a"),
    completed: index < completedByStatus[status],
  }));
}

export const orders: Order[] = [
  {
    id: "CLN784512",
    customerId: "cus-001",
    customerName: "Priya Sharma",
    serviceId: "wash-iron",
    serviceName: "Wash & Iron",
    status: "delivered",
    dateTime: "12 May 2026, 10:30 AM",
    pickupTime: "12 May 2026, 10:30 AM",
    deliveryTime: "12 May 2026, 07:30 PM",
    address: "B 250, Baker Street, Indiranagar, Bengaluru",
    items: [
      { ...itemCatalog[0], quantity: 4 },
      { ...itemCatalog[1], quantity: 2 },
      { ...itemCatalog[2], quantity: 1 },
    ],
    subtotal: 240,
    deliveryCharge: 20,
    total: 260,
    paymentStatus: "Paid",
    riderName: "Rohan Das",
    riderPhone: "+91 90001 11122",
    timeline: makeTimeline("delivered"),
  },
  {
    id: "CLN784513",
    customerId: "cus-001",
    customerName: "Priya Sharma",
    serviceId: "dry-cleaning",
    serviceName: "Dry Cleaning",
    status: "in-progress",
    dateTime: "13 May 2026, 11:00 AM",
    pickupTime: "13 May 2026, 11:00 AM",
    deliveryTime: "13 May 2026, 08:00 PM",
    address: "B 250, Baker Street, Indiranagar, Bengaluru",
    items: [
      { ...itemCatalog[2], quantity: 2, unitPrice: 108 },
      { ...itemCatalog[3], quantity: 1, unitPrice: 99 },
    ],
    subtotal: 180,
    deliveryCharge: 20,
    total: 200,
    paymentStatus: "Pending",
    riderName: "Meera Khan",
    riderPhone: "+91 90001 11123",
    timeline: makeTimeline("in-progress"),
  },
  {
    id: "CLN784514",
    customerId: "cus-002",
    customerName: "Aarav Mehta",
    serviceId: "ironing",
    serviceName: "Ironing",
    status: "pending-pickup",
    dateTime: "18 Jun 2026, 09:00 AM",
    pickupTime: "18 Jun 2026, 09:00 AM",
    deliveryTime: "18 Jun 2026, 05:30 PM",
    address: "18 Lake View Road, Koramangala, Bengaluru",
    items: [
      { ...itemCatalog[0], quantity: 6, unitPrice: 14 },
      { ...itemCatalog[4], quantity: 3, unitPrice: 19 },
    ],
    subtotal: 141,
    deliveryCharge: 25,
    total: 166,
    paymentStatus: "Pending",
    riderName: "Rohan Das",
    riderPhone: "+91 90001 11122",
    timeline: makeTimeline("pending-pickup"),
  },
  {
    id: "CLN784515",
    customerId: "cus-003",
    customerName: "Neha Iyer",
    serviceId: "wash-iron",
    serviceName: "Wash & Iron",
    status: "out-for-delivery",
    dateTime: "18 Jun 2026, 08:15 AM",
    pickupTime: "18 Jun 2026, 08:15 AM",
    deliveryTime: "18 Jun 2026, 07:00 PM",
    address: "72 Palm Grove, HSR Layout, Bengaluru",
    items: [
      { ...itemCatalog[5], quantity: 2 },
      { ...itemCatalog[3], quantity: 2 },
    ],
    subtotal: 250,
    deliveryCharge: 20,
    total: 270,
    paymentStatus: "Paid",
    riderName: "Meera Khan",
    riderPhone: "+91 90001 11123",
    timeline: makeTimeline("out-for-delivery"),
  },
];

export const notifications = [
  { id: "n1", title: "Order Delivered", body: "Your order #CLN784512 has been delivered.", time: "12 May 2026, 07:45 PM", tone: "success" },
  { id: "n2", title: "Out for Delivery", body: "Your order #CLN784515 is out for delivery.", time: "18 Jun 2026, 05:15 PM", tone: "warning" },
  { id: "n3", title: "Order Picked Up", body: "Your order #CLN784513 has been picked up.", time: "13 May 2026, 11:10 AM", tone: "info" },
];

export function getOrderById(id: string) {
  return orders.find((order) => order.id.toLowerCase() === id.toLowerCase());
}

export function getServiceById(id: ServiceId | string) {
  return services.find((service) => service.id === id);
}

export function getDashboardStats() {
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);

  return {
    totalOrders: orders.length,
    pendingPickup: orders.filter((order) => order.status === "pending-pickup").length,
    inWashing: orders.filter((order) => order.status === "in-washing" || order.status === "in-progress").length,
    readyDelivery: orders.filter((order) => order.status === "ready-delivery" || order.status === "out-for-delivery").length,
    revenue,
    customerCount: customers.length,
    statusLabels: ORDER_STATUS_META,
  };
}

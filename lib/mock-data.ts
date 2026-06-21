import { type ReferenceSpriteName } from "@/components/admin/reference-sprite-icon";

export type OrderStatus =
  | "New"
  | "Picked Up"
  | "In Cleaning"
  | "Ready"
  | "Delivered";

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

export const ordersOverviewData = [
  { day: "Mon", orders: 28 },
  { day: "Tue", orders: 34 },
  { day: "Wed", orders: 31 },
  { day: "Thu", orders: 45 },
  { day: "Fri", orders: 42 },
  { day: "Sat", orders: 58 },
  { day: "Sun", orders: 49 },
];

export const orderStatusData: Array<{
  label: OrderStatus;
  value: number;
  color: string;
  icon: ReferenceSpriteName;
}> = [
  { label: "New", value: 12, color: "bg-[#075DFF]", icon: "statusNew" },
  { label: "Picked Up", value: 18, color: "bg-[#13A33D]", icon: "statusPicked" },
  { label: "In Cleaning", value: 22, color: "bg-[#FF930A]", icon: "statusCleaning" },
  { label: "Ready", value: 14, color: "bg-[#17C4C6]", icon: "statusReady" },
  { label: "Delivered", value: 31, color: "bg-[#13A33D]", icon: "statusDelivered" },
];

export const todayPickups: OperationOrder[] = [
  {
    id: "DC-1027",
    customer: "Rahul Verma",
    area: "MG Road, Bengaluru",
    time: "10:00 AM",
    status: "Scheduled",
    avatar: "avatarRahul",
  },
  {
    id: "DC-1028",
    customer: "Sneha Iyer",
    area: "Koramangala, Bengaluru",
    time: "12:30 PM",
    status: "Scheduled",
    avatar: "avatarSneha",
  },
  {
    id: "DC-1029",
    customer: "Arjun Mehta",
    area: "Whitefield, Bengaluru",
    time: "5:00 PM",
    status: "Scheduled",
    avatar: "avatarArjun",
  },
  {
    id: "DC-1030",
    customer: "Vikas Rao",
    area: "Indiranagar, Bengaluru",
    time: "5:00 PM",
    status: "Scheduled",
    avatar: "avatarVikram",
  },
];

export const todayDeliveries: OperationOrder[] = [
  {
    id: "DC-0994",
    customer: "Priya Sharma",
    area: "Whitefield, Bengaluru",
    time: "11:00 AM",
    status: "Out for Delivery",
    avatar: "avatarPriya",
  },
  {
    id: "DC-0998",
    customer: "Vikram Singh",
    area: "HSR Layout, Bengaluru",
    time: "1:30 PM",
    status: "Out for Delivery",
    avatar: "avatarVikram",
  },
  {
    id: "DC-1001",
    customer: "Neha Patil",
    area: "Indiranagar, Bengaluru",
    time: "4:00 PM",
    status: "Delivered",
    avatar: "avatarNeha",
  },
  {
    id: "DC-1005",
    customer: "Ananya Gupta",
    area: "Koramangala, Bengaluru",
    time: "6:00 PM",
    status: "Delivered",
    avatar: "avatarPriya",
  },
];

export const recentOrders: RecentOrder[] = [
  {
    id: "DC-1031",
    customer: "Meera Krishnan",
    service: "Wash & Fold",
    pickupDate: "19 Jun 2026",
    deliveryDate: "21 Jun 2026",
    status: "New",
    payment: "Unpaid",
    amount: "₹780",
  },
  {
    id: "DC-1026",
    customer: "Arjun Menon",
    service: "Dry Cleaning",
    pickupDate: "19 Jun 2026",
    deliveryDate: "22 Jun 2026",
    status: "Picked Up",
    payment: "Partial",
    amount: "₹2,450",
  },
  {
    id: "DC-1019",
    customer: "Sanya Gupta",
    service: "Steam Ironing",
    pickupDate: "18 Jun 2026",
    deliveryDate: "20 Jun 2026",
    status: "In Cleaning",
    payment: "Paid",
    amount: "₹540",
  },
  {
    id: "DC-1014",
    customer: "Nikhil Bansal",
    service: "Premium Laundry",
    pickupDate: "18 Jun 2026",
    deliveryDate: "20 Jun 2026",
    status: "Ready",
    payment: "Paid",
    amount: "₹1,680",
  },
  {
    id: "DC-1008",
    customer: "Ritika Bose",
    service: "Saree Roll Press",
    pickupDate: "17 Jun 2026",
    deliveryDate: "19 Jun 2026",
    status: "Delivered",
    payment: "Paid",
    amount: "₹1,100",
  },
  {
    id: "DC-1002",
    customer: "Aditya Kulkarni",
    service: "Shoe Cleaning",
    pickupDate: "17 Jun 2026",
    deliveryDate: "21 Jun 2026",
    status: "In Cleaning",
    payment: "Unpaid",
    amount: "₹899",
  },
];

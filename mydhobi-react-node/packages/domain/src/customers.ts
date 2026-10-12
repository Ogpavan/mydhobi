export type CustomerStatus = "active" | "inactive";
export type CustomerType = "individual" | "business";
export type PaymentMethod = "cash" | "upi" | "card" | "bank_transfer";
export type Customer = {
  id: string;
  storeId: string | null;
  discountGroupId: number | null;
  fullName: string;
  mobile: string;
  whatsapp: string;
  customerType: CustomerType;
  houseFlatNo: string;
  streetArea: string;
  landmark: string;
  city: string;
  pincode: string;
  googleMapsPin: string;
  pickupFrequency: string;
  assignedRider: string;
  assignedRoute: string;
  rateCard: string;
  paymentMethod: PaymentMethod;
  creditCustomer: boolean;
  creditLimit: number | null;
  pickupInstructions: string;
  internalNotes: string;
  status: CustomerStatus;
  hasLogin: boolean;
  walletBalance: number;
  createdAt: string;
};
export type CustomerPayload = Omit<
  Customer,
  | "id"
  | "storeId"
  | "discountGroupId"
  | "hasLogin"
  | "walletBalance"
  | "createdAt"
>;
type CustomerRow = {
  id: string;
  store_id: string | null;
  full_name: string;
  mobile: string;
  whatsapp: string;
  customer_type: CustomerType;
  house_flat_no: string;
  street_area: string;
  landmark: string;
  city: string;
  pincode: string;
  google_maps_pin: string;
  pickup_frequency: string;
  assigned_rider: string;
  assigned_route: string;
  rate_card: string;
  payment_method: PaymentMethod;
  credit_customer: boolean;
  credit_limit: string | null;
  pickup_instructions: string;
  internal_notes: string;
  status: CustomerStatus;
  user_id: string | null;
  wallet_balance?: string | null;
  created_at: Date;
};

export type AdminBookingItemInput = {
  garmentId: number;
  serviceId: number;
  quantity: number;
  packingType: string;
  brand: string;
  fabric: string;
  defect: string;
  color: string;
  remark: string;
};
export type AdminBookingInput = {
  customerId: string;
  tariffId: number;
  bookingType: "general" | "package";
  pickupAt: string;
  paymentMethod: "cash" | "upi" | "card";
  instructions: string;
  idempotencyKey: string;
  chargeCodes?: string[];
  customChargeAmount?: number | null;
  items: AdminBookingItemInput[];
};
type CustomerBookingRow = {
  user_id: string | null;
  store_id: string | null;
  full_name: string;
  mobile: string;
  house_flat_no: string;
  street_area: string;
  landmark: string;
  city: string;
  pincode: string;
};
type PricedItem = AdminBookingItemInput & {
  itemName: string;
  serviceName: string;
  unitPrice: number;
};

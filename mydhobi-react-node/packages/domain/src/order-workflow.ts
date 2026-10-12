type OrderRow = {
  id: string;
  user_id: string;
  store_id: string | null;
  status: string;
  pickup_at: Date | string;
  payment_method: string;
  payment_status: string;
  amount: string | number;
  coupon_code: string | null;
};

import type { PoolClient } from "pg";

import {
  allowedOrderTransitions,
  orderStatuses,
  type PortalOrderStatus,
} from "@/lib/order-lifecycle";
import {
  releaseReferralForOrder,
  rewardReferralForOrder,
} from "@/lib/referrals";

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

function orderStatus(value: unknown): PortalOrderStatus {
  return orderStatuses.includes(value as PortalOrderStatus)
    ? (value as PortalOrderStatus)
    : "New";
}

async function refundOrCancelPayment(client: PoolClient, order: OrderRow) {
  const paymentResult = await client.query(
    `SELECT * FROM customer_payments
     WHERE order_id=$1 AND kind='Order' FOR UPDATE`,
    [order.id],
  );
  const payment = paymentResult.rows[0];
  if (!payment) return;

  if (payment.status === "Paid") {
    await client.query(
      "UPDATE customer_payments SET status='Refunded',updated_at=NOW() WHERE id=$1",
      [payment.id],
    );
    await client.query(
      "UPDATE customer_orders SET payment_status='Refunded' WHERE id=$1",
      [order.id],
    );
    await client.query(
      `INSERT INTO customer_wallets (user_id,balance)
       VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE
       SET balance=customer_wallets.balance+EXCLUDED.balance,updated_at=NOW()`,
      [order.user_id, payment.amount],
    );
    await client.query(
      `INSERT INTO customer_wallet_transactions (user_id,label,amount)
       VALUES ($1,$2,$3)`,
      [order.user_id, `Refund for #${order.id}`, payment.amount],
    );
    await client.query(
      `INSERT INTO customer_notifications (user_id,title,message)
       VALUES ($1,'Payment Refunded',$2)`,
      [
        order.user_id,
        `₹${Number(payment.amount).toFixed(2)} was added to your wallet.`,
      ],
    );
    return;
  }

  if (payment.status === "Pending") {
    await client.query(
      "UPDATE customer_payments SET status='Cancelled',updated_at=NOW() WHERE id=$1",
      [payment.id],
    );
    await client.query(
      "UPDATE customer_orders SET payment_status='Cancelled' WHERE id=$1",
      [order.id],
    );
  }
}

async function collectCashPayment(client: PoolClient, order: OrderRow) {
  if (order.payment_method !== "cash" || order.payment_status !== "Pending") return;
  await client.query(
    `UPDATE customer_payments SET status='Paid',updated_at=NOW()
     WHERE order_id=$1 AND kind='Order' AND status='Pending'`,
    [order.id],
  );
  await client.query(
    "UPDATE customer_orders SET payment_status='Paid' WHERE id=$1",
    [order.id],
  );
}

async function syncTasks(
  client: PoolClient,
  order: OrderRow,
  nextStatus: PortalOrderStatus,
) {
  if (["Picked Up", "In Cleaning", "Ready", "Out for Delivery", "Delivered"].includes(nextStatus)) {
    await client.query(
      `INSERT INTO order_pickups
       (order_id,scheduled_at,status,completed_at)
       VALUES ($1,$2,'Completed',NOW())
       ON CONFLICT (order_id) DO UPDATE
       SET status='Completed',completed_at=COALESCE(order_pickups.completed_at,NOW()),updated_at=NOW()`,
      [order.id, order.pickup_at],
    );
  }

  if (["Ready", "Out for Delivery", "Delivered"].includes(nextStatus)) {
    const deliveryStatus = nextStatus === "Ready" ? "Ready" : nextStatus;
    await client.query(
      `INSERT INTO order_deliveries (order_id,scheduled_at,status,completed_at)
       VALUES (
         $1,GREATEST($2::timestamptz + interval '1 day',NOW()),$3,
         CASE WHEN $3::varchar='Delivered' THEN NOW() ELSE NULL END
       )
       ON CONFLICT (order_id) DO UPDATE
       SET status=$3,
         completed_at=CASE WHEN $3::varchar='Delivered' THEN COALESCE(order_deliveries.completed_at,NOW()) ELSE order_deliveries.completed_at END,
         updated_at=NOW()`,
      [order.id, order.pickup_at, deliveryStatus],
    );
  }

  if (nextStatus === "Cancelled") {
    await client.query(
      `UPDATE order_pickups SET status='Cancelled',updated_at=NOW()
       WHERE order_id=$1 AND status NOT IN ('Completed','Cancelled')`,
      [order.id],
    );
    await client.query(
      `UPDATE order_deliveries SET status='Cancelled',updated_at=NOW()
       WHERE order_id=$1 AND status NOT IN ('Delivered','Cancelled')`,
      [order.id],
    );
  }
}

export async function applyOrderStatusTransition(
  client: PoolClient,
  id: string,
  nextStatus: PortalOrderStatus,
  note: string,
  storeId?: string | null,
) {
  const currentResult = await client.query<OrderRow>(
    `SELECT id,user_id,store_id,status,pickup_at,payment_method,
      payment_status,amount,coupon_code
     FROM customer_orders
     WHERE id=$1 AND ($2::uuid IS NULL OR store_id=$2)
     FOR UPDATE`,
    [id, storeId ?? null],
  );
  const current = currentResult.rows[0];
  if (!current) return { kind: "not_found" as const };

  const currentStatus = orderStatus(current.status);
  if (!allowedOrderTransitions[currentStatus].includes(nextStatus)) {
    return { kind: "invalid_transition" as const, currentStatus };
  }
  if (nextStatus === "Picked Up") {
    const pickup = await client.query(
      "SELECT rider_id FROM order_pickups WHERE order_id=$1",
      [id],
    );
    if (!pickup.rows[0]?.rider_id) {
      return { kind: "rider_required" as const, task: "pickup" as const };
    }
  }
  if (["Out for Delivery", "Delivered"].includes(nextStatus)) {
    const delivery = await client.query(
      "SELECT rider_id FROM order_deliveries WHERE order_id=$1",
      [id],
    );
    if (!delivery.rows[0]?.rider_id) {
      return { kind: "rider_required" as const, task: "delivery" as const };
    }
  }
  if (
    nextStatus === "Delivered" &&
    current.payment_method !== "cash" &&
    current.payment_status !== "Paid"
  ) {
    return { kind: "payment_required" as const };
  }

  await syncTasks(client, current, nextStatus);

  if (nextStatus === "Cancelled") {
    await refundOrCancelPayment(client, current);
    if (current.coupon_code && current.coupon_code !== "REFERRAL20") {
      await client.query(
        `UPDATE promo_offers
         SET usage_count=GREATEST(usage_count-1,0),updated_at=NOW()
         WHERE UPPER(code)=UPPER($1)
           AND (store_id=$2 OR store_id IS NULL)`,
        [current.coupon_code, current.store_id],
      );
    }
    await releaseReferralForOrder(client, current.id);
  }

  if (nextStatus === "Delivered") {
    await collectCashPayment(client, current);
    await rewardReferralForOrder(client, current.id);
  }

  await client.query(
    `UPDATE customer_orders
     SET status=$2,
       delivery_at=CASE WHEN $2::varchar='Delivered' THEN NOW() ELSE delivery_at END,
       updated_at=NOW()
     WHERE id=$1`,
    [id, nextStatus],
  );
  await client.query(
    `INSERT INTO customer_order_status_history (order_id,status,note)
     VALUES ($1,$2,$3)`,
    [id, nextStatus, note],
  );
  await client.query(
    `INSERT INTO customer_notifications (user_id,title,message)
     VALUES ($1,$2,$3)`,
    [
      current.user_id,
      `Order ${nextStatus}`,
      `Order #${id} is now ${nextStatus.toLowerCase()}.`,
    ],
  );
  return { kind: "updated" as const };
}

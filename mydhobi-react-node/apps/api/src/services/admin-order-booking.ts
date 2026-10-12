import type {
  AdminBookingInput,
  AdminBookingItemInput,
} from "@mydhobi/domain/admin-order-booking";
import { randomUUID } from "crypto";
export type {
  AdminBookingInput,
  AdminBookingItemInput,
} from "@mydhobi/domain/admin-order-booking";

import bcrypt from "bcryptjs";

import {
  calculateDiscountedPrice,
  getDiscountRulesForGroup,
  getStoreDiscountGroupId,
  type DiscountType,
} from "@/lib/discount-groups";

import { ensureCustomerTable } from "@/lib/customers";
import { pool } from "@/lib/db";

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
  baseUnitPrice: number;
  discountType: DiscountType | null;
  discountValue: number;
  discountAmount: number;
  unitPrice: number;
};

type ChargeRow = {
  code: string;
  charge_type: "extra" | "delivery" | "tax";
  amount: string;
};

export async function createAdminBooking(
  input: AdminBookingInput,
  storeScope?: string | null,
) {
  await ensureCustomerTable();
  const generatedPasswordHash = await bcrypt.hash(randomUUID(), 12);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const customerResult = await client.query<CustomerBookingRow>(
      `SELECT user_id,store_id,full_name,mobile,house_flat_no,street_area,
         landmark,city,pincode
       FROM customers
       WHERE id=$1 AND status='active'
         AND ($2::uuid IS NULL OR store_id=$2)
       FOR UPDATE`,
      [input.customerId, storeScope ?? null],
    );
    const customer = customerResult.rows[0];
    if (!customer) throw new Error("CUSTOMER_NOT_FOUND");

    const tariff = await client.query(
      "SELECT 1 FROM rate_card_groups WHERE id=$1 AND is_active=TRUE",
      [input.tariffId],
    );
    if (!tariff.rows[0]) throw new Error("TARIFF_NOT_FOUND");

    let storeId = storeScope ?? customer.store_id;
    if (storeId) {
      const store = await client.query(
        "SELECT 1 FROM stores WHERE id=$1 AND status='active'",
        [storeId],
      );
      if (!store.rows[0]) throw new Error("STORE_NOT_AVAILABLE");
    } else {
      const assignment = await client.query<{ store_id: string }>(
        `SELECT assignments.store_id
         FROM store_rate_card_assignments assignments
         JOIN stores ON stores.id=assignments.store_id AND stores.status='active'
         WHERE assignments.group_id=$1
         ORDER BY stores.store_number,stores.name
         LIMIT 1`,
        [input.tariffId],
      );
      storeId = assignment.rows[0]?.store_id ?? null;
    }
    if (!storeId) throw new Error("STORE_NOT_AVAILABLE");

    if (storeScope) {
      const assignedTariff = await client.query(
        `SELECT 1 FROM store_rate_card_assignments
         WHERE store_id=$1 AND group_id=$2`,
        [storeId, input.tariffId],
      );
      if (!assignedTariff.rows[0]) throw new Error("TARIFF_NOT_ASSIGNED");
    }

    let userId = customer.user_id;
    if (!userId) {
      const existingUser = await client.query<{ id: string; role: string }>(
        "SELECT id,role FROM app_users WHERE mobile=$1 LIMIT 1",
        [customer.mobile],
      );
      if (existingUser.rows[0] && existingUser.rows[0].role !== "customer") {
        throw new Error("CUSTOMER_MOBILE_IN_USE");
      }
      if (existingUser.rows[0]) {
        userId = existingUser.rows[0].id;
      } else {
        const createdUser = await client.query<{ id: string }>(
          `INSERT INTO app_users(
             email,mobile,password_hash,name,designation,role,status
           ) VALUES($1,$2,$3,$4,'Customer','customer','active')
           RETURNING id`,
          [
            `customer.${customer.mobile}@mydhobi.local`,
            customer.mobile,
            generatedPasswordHash,
            customer.full_name,
          ],
        );
        userId = createdUser.rows[0].id;
      }
      await client.query(
        "UPDATE customers SET user_id=$2,store_id=$3,updated_at=NOW() WHERE id=$1",
        [input.customerId, userId, storeId],
      );
    } else if (customer.store_id !== storeId) {
      await client.query(
        "UPDATE customers SET store_id=$2,updated_at=NOW() WHERE id=$1",
        [input.customerId, storeId],
      );
    }

    await client.query(
      `INSERT INTO customer_addresses(
         user_id,address_type,full_address,landmark,city,pincode,is_default
       )
       SELECT $1,'Home',$2,$3,$4,$5,TRUE
       WHERE NOT EXISTS(SELECT 1 FROM customer_addresses WHERE user_id=$1)`,
      [
        userId,
        [customer.house_flat_no, customer.street_area]
          .filter(Boolean)
          .join(", "),
        customer.landmark,
        customer.city,
        customer.pincode,
      ],
    );

    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `${userId}:${input.idempotencyKey}`,
    ]);
    const existingOrder = await client.query<{ id: string }>(
      `SELECT id FROM customer_orders
       WHERE user_id=$1 AND idempotency_key=$2 LIMIT 1`,
      [userId, input.idempotencyKey],
    );
    if (existingOrder.rows[0]) {
      await client.query("COMMIT");
      return { id: existingOrder.rows[0].id };
    }

    const requiredUnit = input.bookingType === "general" ? "piece" : "kg";
    const discountGroupId = await getStoreDiscountGroupId(client, storeId);
    const discountRules = discountGroupId
      ? await getDiscountRulesForGroup(client, discountGroupId)
      : new Map();
    const pricedItems: PricedItem[] = [];
    for (const item of input.items) {
      const priceResult = await client.query<{
        garment_name: string;
        service_name: string;
        price: string;
        pricing_unit: string;
      }>(
        `SELECT garments.name AS garment_name,services.name AS service_name,
           rates.price,rates.pricing_unit
         FROM rate_card_group_rates rates
         JOIN garment_service_mappings mappings ON mappings.id=rates.mapping_id
           AND mappings.is_enabled=TRUE
         JOIN garments ON garments.id=mappings.garment_id AND garments.is_active=TRUE
         JOIN services ON services.id=mappings.service_id AND services.is_active=TRUE
         WHERE rates.group_id=$1 AND mappings.garment_id=$2
           AND mappings.service_id=$3 AND rates.is_enabled=TRUE
         LIMIT 1`,
        [input.tariffId, item.garmentId, item.serviceId],
      );
      const price = priceResult.rows[0];
      if (!price || price.pricing_unit !== requiredUnit) {
        throw new Error("ITEM_PRICE_NOT_FOUND");
      }
      const pricing = calculateDiscountedPrice(
        Number(price.price),
        discountRules.get(item.serviceId),
      );
      pricedItems.push({
        ...item,
        itemName: price.garment_name,
        serviceName: price.service_name,
        baseUnitPrice: pricing.basePrice,
        discountType: pricing.discountType,
        discountValue: pricing.discountValue,
        discountAmount: pricing.discountAmount,
        unitPrice: pricing.finalPrice,
      });
    }

    const itemCount = pricedItems.reduce((sum, item) => sum + item.quantity, 0);
    const amount =
      Math.round(
        pricedItems.reduce(
          (sum, item) => sum + item.quantity * item.unitPrice,
          0,
        ) * 100,
      ) / 100;
    const discountAmount =
      Math.round(
        pricedItems.reduce(
          (sum, item) => sum + item.quantity * item.discountAmount,
          0,
        ) * 100,
      ) / 100;
    const selectedChargeCodes = [...new Set(input.chargeCodes ?? [])];
    const customChargeAmount = input.customChargeAmount ?? 0;
    if (
      !Number.isFinite(customChargeAmount) ||
      customChargeAmount < 0 ||
      customChargeAmount > 100000
    ) {
      throw new Error("INVALID_ORDER_CHARGE");
    }
    const chargeResult = selectedChargeCodes.length
      ? await client.query<ChargeRow>(
          `SELECT code,charge_type,amount
           FROM order_charges
           WHERE code = ANY($1::text[]) AND is_active=TRUE`,
          [selectedChargeCodes],
        )
      : { rows: [] as ChargeRow[] };
    if (chargeResult.rows.length !== selectedChargeCodes.length) {
      throw new Error("INVALID_ORDER_CHARGE");
    }
    const fixedCharges = chargeResult.rows
      .filter((charge) => charge.charge_type !== "tax")
      .reduce((sum, charge) => sum + Number(charge.amount), 0);
    const taxRate = chargeResult.rows
      .filter((charge) => charge.charge_type === "tax")
      .reduce((sum, charge) => sum + Number(charge.amount), 0);
    const beforeTax = amount + fixedCharges + customChargeAmount;
    const totalAmount =
      Math.round((beforeTax + (beforeTax * taxRate) / 100) * 100) / 100;
    const services = [...new Set(pricedItems.map((item) => item.serviceName))];
    const orderService =
      services.length === 1 ? services[0] : "Multiple Services";
    const orderId = `ORD${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
    const address = [
      customer.house_flat_no,
      customer.street_area,
      customer.landmark,
      customer.city,
      customer.pincode,
    ]
      .filter(Boolean)
      .join(", ")
      .slice(0, 500);

    await client.query(
      `INSERT INTO customer_orders(
         id,user_id,store_id,status,service,item_count,amount,pickup_at,
         payment_method,payment_status,address_text,instructions,
         discount_amount,idempotency_key
       ) VALUES($1,$2,$3,'New',$4,$5,$6,$7,$8,'Pending',$9,$10,$11,$12)`,
      [
        orderId,
        userId,
        storeId,
        orderService,
        itemCount,
        totalAmount,
        input.pickupAt,
        input.paymentMethod,
        address,
        input.instructions,
        discountAmount,
        input.idempotencyKey,
      ],
    );
    for (const item of pricedItems) {
      await client.query(
        `INSERT INTO customer_order_items(
           order_id,item_name,quantity,unit_price,garment_id,garment_name,
           service_id,service_name,packing_type,brand,fabric,defect,color,remark,
           base_unit_price,discount_type,discount_value,discount_amount
         ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
        [
          orderId,
          `${item.itemName} · ${item.serviceName}`.slice(0, 100),
          item.quantity,
          item.unitPrice,
          item.garmentId,
          item.itemName,
          item.serviceId,
          item.serviceName,
          item.packingType,
          item.brand,
          item.fabric,
          item.defect,
          item.color,
          item.remark,
          item.baseUnitPrice,
          item.discountType ?? "None",
          item.discountValue,
          item.discountAmount,
        ],
      );
    }
    await client.query(
      `INSERT INTO customer_payments(
         user_id,order_id,kind,method,status,amount,reference
       ) VALUES($1,$2,'Order',$3,'Pending',$4,$5)`,
      [userId, orderId, input.paymentMethod, totalAmount, `ORDER-${orderId}`],
    );
    await client.query(
      `INSERT INTO order_pickups(order_id,scheduled_at,status,notes)
       VALUES($1,$2,'Scheduled',$3)`,
      [orderId, input.pickupAt, input.instructions],
    );
    await client.query(
      `INSERT INTO customer_order_status_history(order_id,status,note)
       VALUES($1,'New','Order booked by store')`,
      [orderId],
    );
    await client.query(
      `INSERT INTO customer_notifications(user_id,title,message)
       VALUES($1,'Order Confirmed',$2)`,
      [userId, `Your order #${orderId} has been confirmed.`],
    );
    await client.query("COMMIT");
    return { id: orderId };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

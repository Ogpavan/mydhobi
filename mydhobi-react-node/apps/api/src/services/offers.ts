import type { Offer, OfferInput } from "@mydhobi/domain/offers";
import type { PoolClient } from "pg";
import { isSchemaMigration } from "../database/schema-mode";
export type { Offer, OfferInput } from "@mydhobi/domain/offers";

import { pool } from "@/lib/db";
import {
  ensureStoreDiscountPolicySchema,
  getStoreDiscountPolicy,
  type StoreDiscountPolicy,
} from "@/lib/stores";

export function parseOfferInput(
  body: Record<string, unknown>,
): OfferInput | null {
  const code =
    typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const discountType = body.discountType;
  const discountValue = Number(body.discountValue);
  const minOrder = Number(body.minOrder);
  const maxDiscount =
    body.maxDiscount === null || body.maxDiscount === ""
      ? null
      : Number(body.maxDiscount);
  const startsAt = typeof body.startsAt === "string" ? body.startsAt : "";
  const endsAt = typeof body.endsAt === "string" ? body.endsAt : "";
  const usageLimit =
    body.usageLimit === null || body.usageLimit === ""
      ? null
      : Number(body.usageLimit);
  if (
    !/^[A-Z0-9_-]{3,30}$/.test(code) ||
    !title ||
    title.length > 120 ||
    (discountType !== "Percentage" && discountType !== "Flat") ||
    !Number.isFinite(discountValue) ||
    discountValue <= 0 ||
    (discountType === "Percentage" && discountValue > 100) ||
    !Number.isFinite(minOrder) ||
    minOrder < 0 ||
    (maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) ||
    Number.isNaN(new Date(startsAt).getTime()) ||
    Number.isNaN(new Date(endsAt).getTime()) ||
    new Date(endsAt) <= new Date(startsAt) ||
    (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1))
  )
    return null;
  return {
    code,
    title,
    discountType,
    discountValue,
    minOrder,
    maxDiscount,
    startsAt,
    endsAt,
    usageLimit,
    isActive: body.isActive !== false,
  };
}

let offerSetupPromise: Promise<void> | null = null;

export function ensureOfferSchema() {
  if (!isSchemaMigration()) return Promise.resolve();

  if (!offerSetupPromise) {
    offerSetupPromise = (async () => {
      await ensureStoreDiscountPolicySchema();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS promo_offers (
          id BIGSERIAL PRIMARY KEY,
          code VARCHAR(30) NOT NULL UNIQUE,
          title VARCHAR(120) NOT NULL,
          discount_type VARCHAR(20) NOT NULL,
          discount_value NUMERIC(12,2) NOT NULL,
          min_order NUMERIC(12,2) NOT NULL DEFAULT 0,
          max_discount NUMERIC(12,2),
          starts_at TIMESTAMPTZ NOT NULL,
          ends_at TIMESTAMPTZ NOT NULL,
          usage_limit INTEGER,
          usage_count INTEGER NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
          created_by_role VARCHAR(30) NOT NULL DEFAULT 'admin',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT promo_offers_discount_type
            CHECK (discount_type IN ('Percentage','Flat')),
          CONSTRAINT promo_offers_dates CHECK (ends_at > starts_at)
        );
        ALTER TABLE promo_offers
          ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
          ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
          ADD COLUMN IF NOT EXISTS created_by_role VARCHAR(30) NOT NULL DEFAULT 'admin';
        CREATE INDEX IF NOT EXISTS promo_offers_active_idx
          ON promo_offers(is_active, starts_at, ends_at);
        CREATE INDEX IF NOT EXISTS promo_offers_store_idx
          ON promo_offers(store_id, created_at DESC);
      `);
    })().catch((error) => {
      offerSetupPromise = null;
      throw error;
    });
  }
  return offerSetupPromise;
}

function mapOffer(row: Record<string, unknown>): Offer {
  return {
    id: String(row.id),
    code: String(row.code),
    title: String(row.title),
    discountType: row.discount_type as Offer["discountType"],
    discountValue: Number(row.discount_value),
    minOrder: Number(row.min_order),
    maxDiscount: row.max_discount === null ? null : Number(row.max_discount),
    startsAt: new Date(String(row.starts_at)).toISOString(),
    endsAt: new Date(String(row.ends_at)).toISOString(),
    usageLimit: row.usage_limit === null ? null : Number(row.usage_limit),
    usageCount: Number(row.usage_count),
    isActive: Boolean(row.is_active),
    storeId: row.store_id === null ? null : String(row.store_id),
    storeName:
      row.store_name === null || row.store_name === undefined
        ? null
        : String(row.store_name),
    createdByUserId:
      row.created_by_user_id === null ? null : String(row.created_by_user_id),
    createdByRole: String(row.created_by_role ?? "admin"),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

const offerSelect = `
  SELECT offers.*, stores.name AS store_name
  FROM promo_offers offers
  LEFT JOIN stores ON stores.id = offers.store_id
`;

export async function listOffers(
  customerOnly = false,
  storeId?: string | null,
) {
  await ensureOfferSchema();
  const filters: string[] = [];
  const values: string[] = [];
  if (customerOnly) {
    filters.push(
      `offers.is_active = TRUE`,
      `offers.starts_at <= NOW()`,
      `offers.ends_at > NOW()`,
      `(offers.usage_limit IS NULL OR offers.usage_count < offers.usage_limit)`,
      `(offers.store_id IS NULL OR (
        stores.discounts_enabled=TRUE AND (
          (offers.discount_type='Percentage' AND
            offers.discount_value <= stores.max_discount_percent AND
            offers.max_discount IS NOT NULL AND
            offers.max_discount <= stores.max_discount_amount) OR
          (offers.discount_type='Flat' AND
            offers.discount_value <= stores.max_discount_amount AND
            (stores.max_discount_percent >= 100 OR
              offers.discount_value <= offers.min_order * (stores.max_discount_percent / 100.0)))
        )
      ))`,
    );
    if (storeId) {
      values.push(storeId);
      filters.push(
        `(offers.store_id IS NULL OR offers.store_id = $${values.length})`,
      );
    } else {
      filters.push(`offers.store_id IS NULL`);
    }
  } else if (storeId) {
    values.push(storeId);
    filters.push(`offers.store_id = $${values.length}`);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const { rows } = await pool.query(
    `${offerSelect} ${where} ORDER BY offers.created_at DESC`,
    values,
  );
  return rows.map(mapOffer);
}

export async function getOfferById(id: string) {
  await ensureOfferSchema();
  const { rows } = await pool.query(
    `${offerSelect} WHERE offers.id = $1 LIMIT 1`,
    [id],
  );
  return rows[0] ? mapOffer(rows[0]) : null;
}

export function validateOfferAgainstPolicy(
  input: OfferInput,
  policy: StoreDiscountPolicy,
) {
  if (!policy.discountsEnabled) return "Store discounts are turned off.";
  if (input.discountType === "Percentage") {
    if (input.discountValue > policy.maxDiscountPercent) {
      return `Maximum allowed discount is ${policy.maxDiscountPercent}%.`;
    }
    if (input.maxDiscount === null) {
      return `Maximum discount amount is required. Limit: ₹${policy.maxDiscountAmount}.`;
    }
    if (input.maxDiscount > policy.maxDiscountAmount) {
      return `Maximum allowed amount is ₹${policy.maxDiscountAmount}.`;
    }
    return null;
  }
  if (input.discountValue > policy.maxDiscountAmount) {
    return `Maximum allowed amount is ₹${policy.maxDiscountAmount}.`;
  }
  if (policy.maxDiscountPercent < 100) {
    const requiredMinimum =
      Math.ceil(
        ((input.discountValue * 100) / policy.maxDiscountPercent) * 100,
      ) / 100;
    if (input.minOrder < requiredMinimum) {
      return `Minimum order must be ₹${requiredMinimum.toLocaleString("en-IN")} or more.`;
    }
  }
  return null;
}

export async function createOffer(
  input: OfferInput,
  owner?: { storeId: string; userId: string; role: string },
) {
  await ensureOfferSchema();
  const { rows } = await pool.query(
    `INSERT INTO promo_offers
     (code,title,discount_type,discount_value,min_order,max_discount,
      starts_at,ends_at,usage_limit,is_active,store_id,created_by_user_id,created_by_role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [
      input.code,
      input.title,
      input.discountType,
      input.discountValue,
      input.minOrder,
      input.maxDiscount,
      input.startsAt,
      input.endsAt,
      input.usageLimit,
      input.isActive,
      owner?.storeId ?? null,
      owner?.userId ?? null,
      owner?.role ?? "admin",
    ],
  );
  return (await getOfferById(String(rows[0].id)))!;
}

export async function updateOffer(id: string, input: OfferInput) {
  await ensureOfferSchema();
  const { rows } = await pool.query(
    `UPDATE promo_offers SET
      code=$2,title=$3,discount_type=$4,discount_value=$5,min_order=$6,
      max_discount=$7,starts_at=$8,ends_at=$9,usage_limit=$10,is_active=$11
     WHERE id=$1 RETURNING *`,
    [
      id,
      input.code,
      input.title,
      input.discountType,
      input.discountValue,
      input.minOrder,
      input.maxDiscount,
      input.startsAt,
      input.endsAt,
      input.usageLimit,
      input.isActive,
    ],
  );
  return rows[0] ? getOfferById(String(rows[0].id)) : null;
}

export async function deleteOffer(id: string) {
  await ensureOfferSchema();
  const result = await pool.query("DELETE FROM promo_offers WHERE id=$1", [id]);
  return Boolean(result.rowCount);
}

function calculateDiscount(
  offer: Offer,
  subtotal: number,
  policy?: StoreDiscountPolicy,
) {
  const raw =
    offer.discountType === "Percentage"
      ? subtotal * (offer.discountValue / 100)
      : offer.discountValue;
  const caps = [subtotal, raw];
  if (offer.maxDiscount !== null) caps.push(offer.maxDiscount);
  if (policy) {
    caps.push(policy.maxDiscountAmount);
    caps.push(subtotal * (policy.maxDiscountPercent / 100));
  }
  return Math.round(Math.min(...caps) * 100) / 100;
}

async function evaluateOffer(
  code: string,
  subtotal: number,
  storeId: string | null | undefined,
  client?: PoolClient,
) {
  await ensureOfferSchema();
  const executor = client ?? pool;
  const values: string[] = [code];
  let storeFilter = `offers.store_id IS NULL`;
  if (storeId) {
    values.push(storeId);
    storeFilter = `(offers.store_id IS NULL OR offers.store_id = $2)`;
  }
  const lock = client ? "FOR UPDATE OF offers" : "";
  const { rows } = await executor.query(
    `${offerSelect}
     WHERE UPPER(offers.code)=UPPER($1) AND offers.is_active=TRUE
       AND offers.starts_at <= NOW() AND offers.ends_at > NOW()
       AND (offers.usage_limit IS NULL OR offers.usage_count < offers.usage_limit)
       AND ${storeFilter}
     LIMIT 1 ${lock}`,
    values,
  );
  if (!rows[0])
    return { valid: false as const, message: "Coupon is not valid." };
  const offer = mapOffer(rows[0]);
  if (subtotal < offer.minOrder) {
    return {
      valid: false as const,
      message: `Add items worth ₹${offer.minOrder.toLocaleString("en-IN")} to use this coupon.`,
    };
  }
  let policy: StoreDiscountPolicy | undefined;
  if (offer.storeId) {
    const currentPolicy = await getStoreDiscountPolicy(offer.storeId);
    if (!currentPolicy)
      return { valid: false as const, message: "Coupon is not valid." };
    const policyError = validateOfferAgainstPolicy(
      {
        code: offer.code,
        title: offer.title,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        minOrder: offer.minOrder,
        maxDiscount: offer.maxDiscount,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
        usageLimit: offer.usageLimit,
        isActive: offer.isActive,
      },
      currentPolicy,
    );
    if (policyError)
      return {
        valid: false as const,
        message: "Coupon is no longer available.",
      };
    policy = currentPolicy;
  }
  return {
    valid: true as const,
    offer,
    discount: calculateDiscount(offer, subtotal, policy),
  };
}

export async function validateOffer(
  code: string,
  subtotal: number,
  storeId?: string | null,
) {
  return evaluateOffer(code, subtotal, storeId);
}

export async function redeemOffer(
  client: PoolClient,
  code: string,
  subtotal: number,
  storeId?: string | null,
) {
  const result = await evaluateOffer(code, subtotal, storeId, client);
  if (!result.valid) return result;
  await client.query(
    "UPDATE promo_offers SET usage_count=usage_count+1 WHERE id=$1",
    [result.offer.id],
  );
  return result;
}

export async function deactivateStoreOffersOutsidePolicy(
  storeId: string,
  policy: StoreDiscountPolicy,
) {
  await ensureOfferSchema();
  if (!policy.discountsEnabled) {
    await pool.query(
      "UPDATE promo_offers SET is_active=FALSE WHERE store_id=$1 AND is_active=TRUE",
      [storeId],
    );
    return;
  }
  await pool.query(
    `UPDATE promo_offers SET is_active=FALSE
     WHERE store_id=$1 AND is_active=TRUE AND (
       (discount_type='Percentage' AND (
         discount_value > $2 OR max_discount IS NULL OR max_discount > $3
       )) OR
       (discount_type='Flat' AND (
         discount_value > $3 OR
         ($2 < 100 AND discount_value > min_order * ($2 / 100.0))
       ))
     )`,
    [storeId, policy.maxDiscountPercent, policy.maxDiscountAmount],
  );
}

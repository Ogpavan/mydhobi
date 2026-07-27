import { pool } from "@/lib/db";

export type Offer = {
  id: string;
  code: string;
  title: string;
  discountType: "Percentage" | "Flat";
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
};

export type OfferInput = Omit<Offer, "id" | "usageCount" | "createdAt">;

export function parseOfferInput(body: Record<string, unknown>): OfferInput | null {
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const discountType = body.discountType;
  const discountValue = Number(body.discountValue);
  const minOrder = Number(body.minOrder);
  const maxDiscount = body.maxDiscount === null || body.maxDiscount === "" ? null : Number(body.maxDiscount);
  const startsAt = typeof body.startsAt === "string" ? body.startsAt : "";
  const endsAt = typeof body.endsAt === "string" ? body.endsAt : "";
  const usageLimit = body.usageLimit === null || body.usageLimit === "" ? null : Number(body.usageLimit);
  if (!/^[A-Z0-9_-]{3,30}$/.test(code) || !title || title.length > 120 ||
      (discountType !== "Percentage" && discountType !== "Flat") ||
      !Number.isFinite(discountValue) || discountValue <= 0 ||
      discountType === "Percentage" && discountValue > 100 ||
      !Number.isFinite(minOrder) || minOrder < 0 ||
      maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0) ||
      Number.isNaN(new Date(startsAt).getTime()) || Number.isNaN(new Date(endsAt).getTime()) ||
      new Date(endsAt) <= new Date(startsAt) ||
      usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) return null;
  return { code, title, discountType, discountValue, minOrder, maxDiscount, startsAt, endsAt, usageLimit, isActive: body.isActive !== false };
}

let offerSetupPromise: Promise<void> | null = null;

export function ensureOfferSchema() {
  if (!offerSetupPromise) {
    offerSetupPromise = pool.query(`
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
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT promo_offers_discount_type
          CHECK (discount_type IN ('Percentage','Flat')),
        CONSTRAINT promo_offers_dates CHECK (ends_at > starts_at)
      );
      CREATE INDEX IF NOT EXISTS promo_offers_active_idx
      ON promo_offers(is_active, starts_at, ends_at);
    `).then(() => undefined).catch((error) => {
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
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function listOffers(customerOnly = false) {
  await ensureOfferSchema();
  const where = customerOnly
    ? `WHERE is_active = TRUE AND starts_at <= NOW() AND ends_at > NOW()
       AND (usage_limit IS NULL OR usage_count < usage_limit)`
    : "";
  const { rows } = await pool.query(
    `SELECT * FROM promo_offers ${where} ORDER BY created_at DESC`,
  );
  return rows.map(mapOffer);
}

export async function createOffer(input: OfferInput) {
  await ensureOfferSchema();
  const { rows } = await pool.query(
    `INSERT INTO promo_offers
     (code,title,discount_type,discount_value,min_order,max_discount,
      starts_at,ends_at,usage_limit,is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
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
    ],
  );
  return mapOffer(rows[0]);
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
  return rows[0] ? mapOffer(rows[0]) : null;
}

export async function deleteOffer(id: string) {
  await ensureOfferSchema();
  const result = await pool.query("DELETE FROM promo_offers WHERE id=$1", [id]);
  return Boolean(result.rowCount);
}

export async function validateOffer(code: string, subtotal: number) {
  await ensureOfferSchema();
  const { rows } = await pool.query(
    `SELECT * FROM promo_offers
     WHERE UPPER(code)=UPPER($1) AND is_active=TRUE
       AND starts_at <= NOW() AND ends_at > NOW()
       AND (usage_limit IS NULL OR usage_count < usage_limit)
     LIMIT 1`,
    [code],
  );
  if (!rows[0]) return { valid: false as const, message: "Coupon is not valid." };
  const offer = mapOffer(rows[0]);
  if (subtotal < offer.minOrder) {
    return {
      valid: false as const,
      message: `Add items worth ₹${offer.minOrder.toLocaleString("en-IN")} to use this coupon.`,
    };
  }
  const raw =
    offer.discountType === "Percentage"
      ? subtotal * (offer.discountValue / 100)
      : offer.discountValue;
  const discount = Math.min(
    subtotal,
    offer.maxDiscount === null ? raw : Math.min(raw, offer.maxDiscount),
  );
  return { valid: true as const, offer, discount: Math.round(discount * 100) / 100 };
}

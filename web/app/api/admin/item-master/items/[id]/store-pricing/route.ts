import { NextResponse } from "next/server";

import { ensureItemMasterSchema, upsertStoreOverride } from "@/lib/item-master";
import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";
import { getCurrentUser } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  await ensureItemMasterSchema();
  const { rows } = await (await import("@/lib/db")).pool.query(`SELECT o.*,st.name AS store_name FROM store_rate_overrides o JOIN stores st ON st.id=o.store_id JOIN garment_service_mappings m ON m.id=o.mapping_id WHERE m.garment_id=$1 ORDER BY st.name,o.id`, [Number((await context.params).id)]);
  return NextResponse.json({ overrides: rows.map((row) => ({ id: Number(row.id), storeId: String(row.store_id), storeName: String(row.store_name), mappingId: Number(row.mapping_id), price: Number(row.price), pricingUnit: row.pricing_unit ? row.pricing_unit as PricingUnit : null, turnaroundHours: row.turnaround_hours === null ? null : Number(row.turnaround_hours), expressAvailable: row.express_available, expressPrice: row.express_price === null ? null : Number(row.express_price), expressTurnaroundHours: row.express_turnaround_hours === null ? null : Number(row.express_turnaround_hours), updatedAt: new Date(row.updated_at).toISOString() })) });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const pricingUnit = body.pricingUnit === null || body.pricingUnit === "" ? null : body.pricingUnit as PricingUnit;
    if (pricingUnit !== null && !PRICING_UNITS.includes(pricingUnit)) return NextResponse.json({ message: "Invalid pricing unit." }, { status: 400 });
    const storeId = typeof body.storeId === "string" ? body.storeId : "";
    const mappingId = Number(body.mappingId);
    const price = Number(body.price);
    if (!storeId || !Number.isInteger(mappingId) || !Number.isFinite(price)) return NextResponse.json({ message: "Choose a store and service and enter a price." }, { status: 400 });
    await ensureItemMasterSchema();
    const validMapping = await (await import("@/lib/db")).pool.query("SELECT 1 FROM garment_service_mappings WHERE id=$1 AND garment_id=$2", [mappingId, Number((await context.params).id)]);
    if (!validMapping.rows[0]) return NextResponse.json({ message: "Service pricing not found." }, { status: 404 });
    const id = await upsertStoreOverride({ storeId, mappingId, price, pricingUnit, turnaroundHours: body.turnaroundHours === "" || body.turnaroundHours === null ? null : Number(body.turnaroundHours), expressAvailable: typeof body.expressAvailable === "boolean" ? body.expressAvailable : null, expressPrice: body.expressPrice === "" || body.expressPrice === null ? null : Number(body.expressPrice), expressTurnaroundHours: body.expressTurnaroundHours === "" || body.expressTurnaroundHours === null ? null : Number(body.expressTurnaroundHours) });
    return NextResponse.json({ id });
  } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to save store pricing." }, { status: 400 }); }
}

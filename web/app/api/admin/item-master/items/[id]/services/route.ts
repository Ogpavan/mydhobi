import { NextResponse } from "next/server";

import { getItem, upsertItemMapping } from "@/lib/item-master";
import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";
import { getCurrentUser } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const item = await getItem(Number((await context.params).id));
  return item ? NextResponse.json({ mappings: item.mappings }) : NextResponse.json({ message: "Item not found." }, { status: 404 });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const pricingUnit = body.pricingUnit as PricingUnit;
    const serviceId = Number(body.serviceId);
    const price = Number(body.price);
    const turnaroundHours = Number(body.turnaroundHours);
    const expressPrice = body.expressPrice === null || body.expressPrice === "" || body.expressPrice === undefined ? null : Number(body.expressPrice);
    const expressTurnaroundHours = body.expressTurnaroundHours === null || body.expressTurnaroundHours === "" || body.expressTurnaroundHours === undefined ? null : Number(body.expressTurnaroundHours);
    if (!Number.isInteger(serviceId) || !Number.isFinite(price) || !Number.isFinite(turnaroundHours) || !PRICING_UNITS.includes(pricingUnit)) return NextResponse.json({ message: "Enter valid service, price, unit, and turnaround." }, { status: 400 });
    const mappingId = await upsertItemMapping(Number((await context.params).id), { serviceId, isEnabled: body.isEnabled !== false, price, pricingUnit, turnaroundHours, expressAvailable: body.expressAvailable === true, expressPrice, expressTurnaroundHours });
    return NextResponse.json({ mappingId });
  } catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to save service pricing." }, { status: 400 }); }
}

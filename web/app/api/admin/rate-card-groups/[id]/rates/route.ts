import { NextResponse } from "next/server";

import { getRateCardGroupItems, upsertRateCardGroupRate } from "@/lib/rate-card-groups";
import { PRICING_UNITS, type PricingUnit } from "@/lib/item-master-types";
import { getCurrentUser } from "@/lib/session";

async function authorized() {
  const user = await getCurrentUser();
  return user && user.role !== "customer" ? user : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const groupId = Number((await context.params).id);
  if (!Number.isInteger(groupId) || groupId < 1) return NextResponse.json({ message: "Invalid rate group." }, { status: 400 });
  const items = await getRateCardGroupItems(groupId);
  return items ? NextResponse.json({ items }) : NextResponse.json({ message: "Rate group not found." }, { status: 404 });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const groupId = Number((await context.params).id);
  if (!Number.isInteger(groupId) || groupId < 1) return NextResponse.json({ message: "Invalid rate group." }, { status: 400 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const pricingUnit = body.pricingUnit as PricingUnit;
    const mappingId = body.mappingId === null || body.mappingId === undefined || body.mappingId === "" ? null : Number(body.mappingId);
    const garmentId = Number(body.garmentId);
    const serviceId = Number(body.serviceId);
    const price = Number(body.price);
    const turnaroundHours = Number(body.turnaroundHours);
    const expressPrice = body.expressPrice === null || body.expressPrice === "" || body.expressPrice === undefined ? null : Number(body.expressPrice);
    const expressTurnaroundHours = body.expressTurnaroundHours === null || body.expressTurnaroundHours === "" || body.expressTurnaroundHours === undefined ? null : Number(body.expressTurnaroundHours);
    if ((mappingId !== null && (!Number.isInteger(mappingId) || mappingId < 1)) || !Number.isInteger(garmentId) || !Number.isInteger(serviceId) || !Number.isFinite(price) || !Number.isFinite(turnaroundHours) || !PRICING_UNITS.includes(pricingUnit)) return NextResponse.json({ message: "Enter valid item, service, price, unit, and turnaround." }, { status: 400 });
    const result = await upsertRateCardGroupRate({ groupId, mappingId, garmentId, serviceId, isEnabled: body.isEnabled !== false, price, pricingUnit, turnaroundHours, expressAvailable: body.expressAvailable === true, expressPrice, expressTurnaroundHours });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Unable to save rate." }, { status: 400 });
  }
}

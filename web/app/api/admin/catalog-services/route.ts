import { NextResponse } from "next/server";

import { CATALOG_UNITS, createCatalogService, listCatalogServices } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ services: await listCatalogServices(true) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const categoryId = typeof body.categoryId === "string" ? body.categoryId : "";
    const imagePath = typeof body.imagePath === "string" ? body.imagePath.trim() : "";
    const rawUnit = typeof body.unit === "string" ? body.unit : "";
    const unit = rawUnit === "item" ? "piece" : CATALOG_UNITS.includes(rawUnit as typeof CATALOG_UNITS[number]) ? rawUnit as typeof CATALOG_UNITS[number] : "kg";
    const regularPrice = Number(body.regularPrice);
    const expressPrice = body.expressPrice === "" || body.expressPrice === null ? null : Number(body.expressPrice);
    const turnaround = typeof body.turnaround === "string" ? body.turnaround.trim() : "";
    const displayOrder = Number(body.displayOrder);
    const variantName = typeof body.variantName === "string" ? body.variantName.trim() : "Standard";
    if (!name || name.length > 100 || !/^\d+$/.test(categoryId) || !Number.isFinite(regularPrice) || regularPrice < 0 ||
        (expressPrice !== null && (!Number.isFinite(expressPrice) || expressPrice < 0)) ||
        !turnaround || turnaround.length > 60 || !Number.isInteger(displayOrder) || displayOrder < 0 || !variantName || variantName.length > 100) {
      return NextResponse.json({ message: "Enter valid service details." }, { status: 400 });
    }
    const service = await createCatalogService({ categoryId, name, imagePath: imagePath.slice(0, 250), unit, regularPrice, expressPrice, turnaround, displayOrder, variantName });
    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505") {
      return NextResponse.json({ message: "A service with this name already exists." }, { status: 409 });
    }
    console.error("Create catalog service failed", error);
    return NextResponse.json({ message: "Unable to create service." }, { status: 500 });
  }
}

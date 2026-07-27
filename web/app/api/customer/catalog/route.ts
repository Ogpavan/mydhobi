import { NextResponse } from "next/server";

import { listCatalogServices, listServiceCategories } from "@/lib/service-catalog";
import { listOffers } from "@/lib/offers";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const [categories, services, offers] = await Promise.all([
    listServiceCategories(false),
    listCatalogServices(false),
    listOffers(true),
  ]);
  return NextResponse.json({ categories, services, offers });
}

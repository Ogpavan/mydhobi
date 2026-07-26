import { NextResponse } from "next/server";

import { listCatalogServices, listServiceCategories } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const [categories, services] = await Promise.all([
    listServiceCategories(false),
    listCatalogServices(false),
  ]);
  return NextResponse.json({ categories, services });
}

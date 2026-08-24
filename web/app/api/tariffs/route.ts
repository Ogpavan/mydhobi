import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import { getTariffSheet } from "@/lib/tariffs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const groupId = Number(url.searchParams.get("groupId"));
  const categoryValue = url.searchParams.get("categoryId");
  const categoryId = categoryValue === null ? undefined : Number(categoryValue);

  if (!Number.isInteger(groupId) || groupId < 1) return NextResponse.json({ message: "Choose a price list." }, { status: 400 });
  if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId < 1)) {
    return NextResponse.json({ message: "Choose a valid category." }, { status: 400 });
  }

  try {
    const sheet = await getTariffSheet(groupId, categoryId);
    return NextResponse.json(sheet, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load tariffs.";
    return NextResponse.json(
      { message },
      { status: message === "Price list not found." ? 404 : 500 },
    );
  }
}

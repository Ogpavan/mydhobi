import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: getDashboardStats() });
}

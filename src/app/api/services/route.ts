import { NextResponse } from "next/server";
import { services } from "@/lib/mock-data";

export async function GET() {
  return NextResponse.json({ data: services });
}

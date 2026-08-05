import { NextResponse } from "next/server";

import {
  createRider,
  listRiders,
  riderStatuses,
  type RiderStatus,
} from "@/lib/riders";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ riders: await listRiders(user.role === "store_manager" ? user.storeId : null) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const mobile = typeof body.mobile === "string" ? body.mobile.trim() : "";
    const area = typeof body.area === "string" ? body.area.trim() : "";
    const status = riderStatuses.includes(body.status as RiderStatus)
      ? (body.status as RiderStatus)
      : "Available";
    if (!name || name.length > 100) {
      return NextResponse.json(
        { message: "Enter the rider name." },
        { status: 400 },
      );
    }
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { message: "Mobile number must contain exactly 10 digits." },
        { status: 400 },
      );
    }
    if (!area || area.length > 100) {
      return NextResponse.json(
        { message: "Enter the rider area." },
        { status: 400 },
      );
    }
    const rider = await createRider({
      name,
      mobile,
      area,
      status,
      storeId: user.role === "store_manager" ? user.storeId : null,
    });
    return NextResponse.json({ rider }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "This mobile number is already used by another rider." },
        { status: 409 },
      );
    }
    console.error("Create rider failed", error);
    return NextResponse.json(
      { message: "Unable to add rider." },
      { status: 500 },
    );
  }
}

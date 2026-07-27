import { NextResponse } from "next/server";

import {
  getRider,
  riderStatuses,
  updateRider,
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

async function isAdmin() {
  const user = await getCurrentUser();
  return Boolean(user && user.role !== "customer");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const rider = await getRider(id);
  return rider
    ? NextResponse.json({ rider })
    : NextResponse.json({ message: "Rider not found." }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const current = await getRider(id);
    if (!current) {
      return NextResponse.json({ message: "Rider not found." }, { status: 404 });
    }

    const name =
      typeof body.name === "string" ? body.name.trim() : undefined;
    const mobile =
      typeof body.mobile === "string" ? body.mobile.trim() : undefined;
    const area =
      typeof body.area === "string" ? body.area.trim() : undefined;
    const status = riderStatuses.includes(body.status as RiderStatus)
      ? (body.status as RiderStatus)
      : undefined;

    if (name !== undefined && (!name || name.length > 100)) {
      return NextResponse.json(
        { message: "Enter the rider name." },
        { status: 400 },
      );
    }
    if (mobile !== undefined && !/^\d{10}$/.test(mobile)) {
      return NextResponse.json(
        { message: "Mobile number must contain exactly 10 digits." },
        { status: 400 },
      );
    }
    if (area !== undefined && (!area || area.length > 100)) {
      return NextResponse.json(
        { message: "Enter the rider area." },
        { status: 400 },
      );
    }
    if (status === "Off Duty" && current.activeJobs > 0) {
      return NextResponse.json(
        { message: "Complete or reassign this rider's active jobs first." },
        { status: 409 },
      );
    }

    const rider = await updateRider(id, { name, mobile, area, status });
    return NextResponse.json({ rider });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { message: "This mobile number is already used by another rider." },
        { status: 409 },
      );
    }
    console.error("Update rider failed", error);
    return NextResponse.json(
      { message: "Unable to update rider." },
      { status: 500 },
    );
  }
}

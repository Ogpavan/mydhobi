import { NextResponse } from "next/server";

import { createPortalComplaint, listPortalComplaints } from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ complaints: await listPortalComplaints(user.id) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json() as Record<string, unknown>;
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const details = typeof body.details === "string" ? body.details.trim() : "";
  if (!subject || subject.length > 150 || details.length > 1000) {
    return NextResponse.json({ message: "Enter a valid complaint." }, { status: 400 });
  }
  return NextResponse.json(
    { complaint: await createPortalComplaint(user.id, subject, details) },
    { status: 201 },
  );
}

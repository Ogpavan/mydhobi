import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";
import {
  complaintStatuses,
  updateComplaint,
  type ComplaintStatus,
} from "@/lib/support";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const status = typeof body.status === "string" ? body.status : "";
    const response =
      typeof body.response === "string" ? body.response.trim() : "";
    if (!complaintStatuses.includes(status as ComplaintStatus)) {
      return NextResponse.json(
        { message: "Select a valid status." },
        { status: 400 },
      );
    }
    if (response.length > 1000) {
      return NextResponse.json(
        { message: "Reply must be 1,000 characters or less." },
        { status: 400 },
      );
    }
    if (status === "Resolved" && !response) {
      return NextResponse.json(
        { message: "Add a reply before resolving the complaint." },
        { status: 400 },
      );
    }
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { message: "Complaint not found." },
        { status: 404 },
      );
    }
    const complaint = await updateComplaint(
      id,
      status as ComplaintStatus,
      response,
      user.role === "store_manager" ? user.storeId : null,
    );
    if (!complaint) {
      return NextResponse.json(
        { message: "Complaint not found." },
        { status: 404 },
      );
    }
    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Update complaint failed", error);
    return NextResponse.json(
      { message: "Unable to update complaint." },
      { status: 500 },
    );
  }
}

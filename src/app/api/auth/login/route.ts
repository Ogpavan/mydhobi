import { NextResponse } from "next/server";
import { z } from "zod";
import { customers } from "@/lib/mock-data";

const loginSchema = z.object({
  phone: z.string().min(10, "Enter a valid mobile number"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const digits = parsed.data.phone.replace(/\D/g, "");
  const customer = customers.find((item) => item.phone.replace(/\D/g, "").endsWith(digits.slice(-10))) ?? customers[0];

  return NextResponse.json({
    data: {
      token: "mock-session-token",
      customer,
    },
  });
}

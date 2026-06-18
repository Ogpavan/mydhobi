import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById } from "@/lib/mock-data";
import { ORDER_STATUSES } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateOrderSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  riderName: z.string().optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const order = getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ data: order });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const order = getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update", details: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({
    data: {
      ...order,
      ...parsed.data,
    },
  });
}

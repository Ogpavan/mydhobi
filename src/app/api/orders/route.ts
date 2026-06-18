import { NextResponse } from "next/server";
import { z } from "zod";
import { customers, orders, services, type Order } from "@/lib/mock-data";
import { ORDER_STATUSES } from "@/lib/constants";

const orderItemSchema = z.object({
  id: z.string(),
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  serviceId: z.string(),
  items: z.array(orderItemSchema).min(1),
  pickupDate: z.string().min(1),
  pickupSlot: z.string().min(1),
  address: z.string().min(8),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const filtered = status && ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
    ? orders.filter((order) => order.status === status)
    : orders;

  return NextResponse.json({ data: filtered });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order", details: parsed.error.flatten() }, { status: 400 });
  }

  const service = services.find((item) => item.id === parsed.data.serviceId);

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const selectedItems = parsed.data.items.flatMap((selected) => {
    const item = service.items.find((catalogItem) => catalogItem.id === selected.id);
    return item ? [{ ...item, quantity: selected.quantity }] : [];
  });

  const subtotal = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryCharge = subtotal > 499 ? 0 : 25;
  const customer = customers[0];
  const order: Order = {
    id: `CLN${Math.floor(800000 + Math.random() * 89999)}`,
    customerId: customer.id,
    customerName: customer.name,
    serviceId: service.id,
    serviceName: service.name,
    status: "pending-pickup",
    dateTime: `${parsed.data.pickupDate}, ${parsed.data.pickupSlot}`,
    pickupTime: `${parsed.data.pickupDate}, ${parsed.data.pickupSlot}`,
    deliveryTime: "Estimated within 24-48 hrs",
    address: parsed.data.address,
    items: selectedItems,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    paymentStatus: "Pending",
    riderName: "Assigning soon",
    riderPhone: "",
    timeline: [
      { id: "confirmed", title: "Order confirmed", description: "We received the order details.", time: "Just now", completed: true },
      { id: "pickup", title: "Pickup assignment", description: "A rider will be assigned shortly.", time: "Pending", completed: false },
    ],
  };

  return NextResponse.json({ data: order }, { status: 201 });
}

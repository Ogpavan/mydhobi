import { HttpResponse } from "@/server/http-response";

import {
  createPortalAddress,
  listPortalAddresses,
} from "@/lib/customer-portal";
import { getCurrentUser } from "@/lib/session";

async function customerUser() {
  const user = await getCurrentUser();
  return user?.role === "customer" ? user : null;
}

export async function GET() {
  const user = await customerUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  return HttpResponse.json({ addresses: await listPortalAddresses(user.id) });
}

export async function POST(request: Request) {
  const user = await customerUser();
  if (!user)
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const type = typeof body.type === "string" ? body.type.trim() : "";
    const fullAddress =
      typeof body.fullAddress === "string" ? body.fullAddress.trim() : "";
    const landmark =
      typeof body.landmark === "string" ? body.landmark.trim() : "";
    const city = typeof body.city === "string" ? body.city.trim() : "";
    const pincode = typeof body.pincode === "string" ? body.pincode.trim() : "";
    if (!["Home", "Office", "Other"].includes(type)) {
      return HttpResponse.json(
        { message: "Select an address type." },
        { status: 400 },
      );
    }
    if (
      !name ||
      name.length > 100 ||
      !/^\d{10}$/.test(phone) ||
      !fullAddress ||
      fullAddress.length > 300 ||
      !city ||
      city.length > 100
    ) {
      return HttpResponse.json(
        { message: "Enter a name, a 10-digit phone number, address and city." },
        { status: 400 },
      );
    }
    if (!/^\d{6}$/.test(pincode)) {
      return HttpResponse.json(
        { message: "Enter a 6-digit pincode." },
        { status: 400 },
      );
    }
    const address = await createPortalAddress(user.id, {
      name,
      phone,
      type,
      fullAddress,
      landmark: landmark.slice(0, 150),
      city,
      pincode,
      isDefault: body.isDefault === true,
    });
    return HttpResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("Create customer address failed", error);
    return HttpResponse.json(
      { message: "Unable to save address." },
      { status: 500 },
    );
  }
}

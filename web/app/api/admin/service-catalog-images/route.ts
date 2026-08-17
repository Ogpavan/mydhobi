import { NextResponse } from "next/server";

import { createServiceCatalogImage } from "@/lib/service-catalog";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function isValidImageData(data: Buffer, mime: string) {
  if (mime === "image/png") {
    return data.length >= 8 && data.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (mime === "image/jpeg") {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  return data.length >= 12 &&
    data.subarray(0, 4).toString("ascii") === "RIFF" &&
    data.subarray(8, 12).toString("ascii") === "WEBP";
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ message: "Choose an image." }, { status: 400 });
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ message: "Choose a PNG, JPG, or WebP image." }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json({ message: "Image must be 2 MB or smaller." }, { status: 400 });
    }

    const data = Buffer.from(await file.arrayBuffer());
    if (!isValidImageData(data, file.type)) {
      return NextResponse.json({ message: "Choose a valid image." }, { status: 400 });
    }

    const id = await createServiceCatalogImage(data, file.type);
    return NextResponse.json({ imagePath: `/api/service-catalog-images/${id}` }, { status: 201 });
  } catch (error) {
    console.error("Upload service catalog image failed", error);
    return NextResponse.json({ message: "Unable to upload image." }, { status: 500 });
  }
}

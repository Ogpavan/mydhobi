import { NextResponse } from "next/server";

import { getServiceCatalogImage } from "@/lib/service-catalog";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Image not found." }, { status: 404 });
  }

  const image = await getServiceCatalogImage(id);
  if (!image) {
    return NextResponse.json({ message: "Image not found." }, { status: 404 });
  }

  const body = image.image_data.buffer.slice(
    image.image_data.byteOffset,
    image.image_data.byteOffset + image.image_data.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(body, {
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": image.image_mime,
    },
  });
}

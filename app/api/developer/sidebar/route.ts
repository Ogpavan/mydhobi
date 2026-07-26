import { NextResponse } from "next/server";

import {
  isSidebarItemKey,
  listSidebarSettings,
  normalizeSidebarLabel,
  saveSidebarSettings,
} from "@/lib/sidebar-settings";
import {
  SIDEBAR_ITEM_DEFINITIONS,
  type SidebarItemKey,
} from "@/lib/sidebar-settings-types";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ICON_SIZE = 2 * 1024 * 1024;
const ALLOWED_ICON_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function isValidImageData(data: Buffer, mime: string) {
  if (mime === "image/png") {
    return data.length >= 8 && data.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (mime === "image/jpeg") {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (mime === "image/webp") {
    return data.length >= 12 &&
      data.subarray(0, 4).toString("ascii") === "RIFF" &&
      data.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { items: await listSidebarSettings() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const labels = {} as Record<SidebarItemKey, string>;
    const icons: Partial<Record<SidebarItemKey, { data: Buffer; mime: string }>> = {};

    for (const item of SIDEBAR_ITEM_DEFINITIONS) {
      const label = normalizeSidebarLabel(formData.get(`label.${item.key}`));
      if (!label) {
        return NextResponse.json(
          { message: `${item.defaultLabel} name is required.` },
          { status: 400 },
        );
      }
      if (label.length > 40) {
        return NextResponse.json(
          { message: `${item.defaultLabel} name is too long.` },
          { status: 400 },
        );
      }
      labels[item.key] = label;

      const file = formData.get(`icon.${item.key}`);
      if (file instanceof File && file.size > 0) {
        if (!ALLOWED_ICON_TYPES.has(file.type)) {
          return NextResponse.json(
            { message: `${item.defaultLabel} icon must be PNG, JPG, or WebP.` },
            { status: 400 },
          );
        }
        if (file.size > MAX_ICON_SIZE) {
          return NextResponse.json(
            { message: `${item.defaultLabel} icon must be 2 MB or smaller.` },
            { status: 400 },
          );
        }

        const data = Buffer.from(await file.arrayBuffer());
        if (!isValidImageData(data, file.type)) {
          return NextResponse.json(
            { message: `${item.defaultLabel} icon is not a valid image.` },
            { status: 400 },
          );
        }
        icons[item.key] = { data, mime: file.type };
      }
    }

    let removedIconKeys: SidebarItemKey[] = [];
    const removedValue = formData.get("removedIconKeys");
    if (typeof removedValue === "string" && removedValue) {
      const parsed = JSON.parse(removedValue) as unknown;
      if (!Array.isArray(parsed) || !parsed.every(
        (key): key is SidebarItemKey => typeof key === "string" && isSidebarItemKey(key),
      )) {
        return NextResponse.json({ message: "Invalid icon list." }, { status: 400 });
      }
      removedIconKeys = parsed;
    }

    const items = await saveSidebarSettings(labels, icons, removedIconKeys);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Save sidebar settings failed", error);
    return NextResponse.json(
      { message: "Unable to save sidebar right now." },
      { status: 500 },
    );
  }
}

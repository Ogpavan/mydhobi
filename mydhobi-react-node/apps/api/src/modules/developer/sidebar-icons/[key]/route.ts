import { HttpResponse } from "@/server/http-response";

import { getCurrentUser } from "@/lib/session";
import { getSidebarIcon, isSidebarItemKey } from "@/lib/sidebar-settings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role === "customer") {
    return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { key } = await params;
  if (!isSidebarItemKey(key)) {
    return HttpResponse.json({ message: "Icon not found." }, { status: 404 });
  }

  const icon = await getSidebarIcon(key);
  if (!icon) {
    return HttpResponse.json({ message: "Icon not found." }, { status: 404 });
  }

  return new HttpResponse(new Uint8Array(icon.icon_data), {
    headers: {
      "Content-Type": icon.icon_mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      ETag: `"${icon.updated_at.getTime()}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { HttpResponse } from "@/server/http-response";

import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return HttpResponse.json({ user: null }, { status: 401 });
  }

  return HttpResponse.json({ user });
}

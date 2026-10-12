import { HttpResponse } from "@/server/http-response";

import { JWT_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = HttpResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set({
    name: JWT_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: 0,
  });

  return response;
}

import { NextResponse, type NextRequest } from "next/server";

import { JWT_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(JWT_COOKIE_NAME)?.value;
  const user = token ? await verifyAuthToken(token) : null;

  const isAdminApi = pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/customer/");
  if (isAdminApi && user?.role === "customer") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (
    (pathname.startsWith("/admin") || pathname.startsWith("/developer")) &&
    (!user || user.role === "customer")
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirect", pathname);

    const response = NextResponse.redirect(loginUrl);
    if (!user) response.cookies.delete(JWT_COOKIE_NAME);

    return response;
  }

  if (pathname.startsWith("/customer") && (!user || user.role !== "customer")) {
    if (user) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(JWT_COOKIE_NAME);
    return response;
  }

  if (pathname === "/" && user) {
    return NextResponse.redirect(
      new URL(user.role === "customer" ? "/customer" : "/admin/dashboard", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/developer/:path*", "/customer/:path*", "/api/:path*"],
};

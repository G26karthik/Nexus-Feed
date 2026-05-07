import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ["/dashboard", "/onboarding", "/interests"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from landing/login
  if ((pathname === "/" || pathname === "/login") && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*", "/onboarding/:path*", "/interests/:path*"],
};

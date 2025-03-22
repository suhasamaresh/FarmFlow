// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    "/dashboard",
    "/produce-status",
    "/register", 
    "/transport",
    "/track",
    "/confirmdelivery",
    "/disputes",
    "/fundvault",
    "/logharvests",
    "/verifyquality",
    "/governance",
    "/claim"
  ];

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Check for the 'source' query parameter
    const source = searchParams.get("source");

    // If 'source=button' is not present, redirect to home
    if (source !== "button") {
      const redirectUrl = new URL("/", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Allow the request to proceed if conditions are met
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/produce-status/:path*", "/register/:path*"], // Match protected routes
};
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // 1. Redirect authenticated users away from Auth pages
    if (token && (pathname === "/login" || pathname === "/signup")) {
      const url = token.role === "ADMIN" ? "/admin" : "/shop";
      return NextResponse.redirect(new URL(url, req.url));
    }

    // 2. Role-based zone protection
    // Redirect Admins away from the user shop to the admin panel
    if (pathname.startsWith("/shop") && token?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // 3. Protect Admin routes
    if (pathname.startsWith("/admin")) {
      if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (token.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/shop", req.url));
      }
    }

    // 4. Protect Customer routes
    const isProtectedRoute = pathname.startsWith("/checkout") || pathname.startsWith("/orders");
    if (isProtectedRoute && !token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Keep this true so our custom logic above handles all redirects
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/shop/:path*",  // ✅ Added to handle Admin -> Shop logic
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
  ],
};

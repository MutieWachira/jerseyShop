import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Global authentication middleware.
 *
 * This middleware extracts the JWT token using `next-auth`'s `getToken` helper.
 * Using `req.nextauth.token` (provided by `withAuth`) does not expose the token
 * when we override the `authorized` callback, which caused the checkout route to
 * think the user was unauthenticated. By calling `getToken` directly we ensure
 * the token is available for all protected routes.
 */
export async function middleware(req: NextRequest) {
  // Retrieve the JWT token from the request cookies.
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // 1️⃣ Redirect authenticated users away from auth pages (login / signup).
  if (token && (pathname === "/login" || pathname === "/signup")) {
    const destination = token.role === "ADMIN" ? "/admin" : "/shop";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // 2️⃣ Role‑based zone protection – admins should never see the shop UI.
  if (pathname.startsWith("/shop") && token?.role === "ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 3️⃣ Protect admin routes.
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

  // 4️⃣ Protect customer routes such as checkout and orders.
  const isProtectedRoute = pathname.startsWith("/checkout") || pathname.startsWith("/orders");
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow the request to continue when no redirect rules apply.
  return NextResponse.next();
}

/**
 * Matcher configuration for the middleware. It runs on authentication pages,
 * the shop UI, checkout flow, order endpoints, and all admin routes.
 */
export const config = {
  matcher: [
    "/login",
    "/signup",
    "/shop/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
  ],
};

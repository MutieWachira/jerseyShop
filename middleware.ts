import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret });

  const url = req.nextUrl.clone();

  // Allow public pages
  if (
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/register") ||
    url.pathname.startsWith("/reset-password") ||
    url.pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  if (!token) {
    // Not logged in, redirect to login
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based redirection
  if (token.role === "ADMIN") {
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  } else {
    // Regular user
    if (!url.pathname.startsWith("/shop")) {
      url.pathname = "/shop";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Apply to all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
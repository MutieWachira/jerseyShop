import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(

  function middleware(req) {

    const token = req.nextauth.token;
    const url = req.nextUrl;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Admin protection
    if (url.pathname.startsWith("/admin") && token.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Shop protection
    if (url.pathname.startsWith("/shop") && token.role !== "USER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

  },

  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }

);

export const config = {

  matcher: [
    "/admin/:path*",
    "/shop/:path*",
    "/dashboard/:path*"
  ]

};
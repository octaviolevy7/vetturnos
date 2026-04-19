import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isVetRoute = pathname.startsWith("/vet");
  const isOwnerRoute =
    pathname.startsWith("/search") ||
    pathname.startsWith("/book") ||
    pathname.startsWith("/appointments") ||
    pathname.startsWith("/clinics") ||
    pathname.startsWith("/dashboard");

  if ((isVetRoute || isOwnerRoute) && !session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isVetRoute && session?.user.role !== "VETERINARIAN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    isOwnerRoute &&
    session?.user.role === "VETERINARIAN" &&
    !pathname.startsWith("/clinics")
  ) {
    return NextResponse.redirect(new URL("/vet/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/vet/:path*", "/search/:path*", "/book/:path*", "/appointments/:path*", "/clinics/:path*", "/dashboard/:path*"],
};

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (req.nextUrl.pathname === "/" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/dashboard/:path*"],
};

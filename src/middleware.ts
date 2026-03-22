import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, signInRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Rate limit sign-in attempts
  if (request.nextUrl.pathname.startsWith("/api/auth")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const rl = await checkRateLimit(signInRateLimit, ip);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Try again later.", code: "RATE_LIMITED" },
        { status: 429 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
